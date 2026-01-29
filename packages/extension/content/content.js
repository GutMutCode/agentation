(function () {
  "use strict";

  let isActive = false;
  let annotations = [];
  let hoveredElement = null;
  let labelElement = null;
  let toolbar = null;
  let animationsPaused = false;
  let markersHidden = false;
  let toolbarExpanded = false;

  let isDragging = false;
  let dragStartPos = null;
  let selectionBox = null;
  let selectedElements = [];
  let justFinishedDrag = false;

  let settings = {
    outputDetail: "standard",
    markerColor: "#ef4444",
    clearAfterCopy: false,
    blockInteractions: false,
    includePlaywrightHint: false,
    language: "en",
  };

  const t = (key, params) => window.agentationI18n?.t(key, params) || key;

  function throttle(fn, wait) {
    let lastTime = 0;
    let timeoutId = null;
    return function (...args) {
      const now = Date.now();
      const remaining = wait - (now - lastTime);

      if (remaining <= 0) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        lastTime = now;
        fn.apply(this, args);
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastTime = Date.now();
          timeoutId = null;
          fn.apply(this, args);
        }, remaining);
      }
    };
  }

  function getElementPosition(selector) {
    try {
      const element = document.querySelector(selector);
      if (!element) return null;

      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      };
    } catch (e) {
      return null;
    }
  }

  function updateMarkerPositions() {
    annotations.forEach((annotation) => {
      const marker = document.querySelector(
        `[data-annotation-id="${annotation.id}"]`,
      );
      if (!marker) return;

      const position = getElementPosition(annotation.selector);
      if (position) {
        marker.style.top = `${position.top - 12}px`;
        marker.style.left = `${position.left - 12}px`;
      }
    });
  }

  const throttledUpdateMarkerPositions = throttle(updateMarkerPositions, 16);

  function getUniqueSelector(element) {
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    const path = [];
    let current = element;

    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      let selector = current.tagName.toLowerCase();

      if (current.className && typeof current.className === "string") {
        const classes = current.className
          .split(/\s+/)
          .filter((c) => c && !c.startsWith("agentation-"))
          .slice(0, 2);
        if (classes.length > 0) {
          selector += "." + classes.map((c) => CSS.escape(c)).join(".");
        }
      }

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (child) => child.tagName === current.tagName,
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = parent;
    }

    return path.join(" > ");
  }

  function getElementDescription(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const classes =
      element.className && typeof element.className === "string"
        ? "." +
          element.className
            .split(/\s+/)
            .filter((c) => c && !c.startsWith("agentation-"))
            .slice(0, 2)
            .join(".")
        : "";

    let text = element.textContent?.trim().slice(0, 30) || "";
    if (text.length === 30) text += "...";

    return `${tag}${id}${classes}${text ? ` "${text}"` : ""}`;
  }

  function createLabel() {
    const label = document.createElement("div");
    label.className = "agentation-label";
    document.body.appendChild(label);
    return label;
  }

  function updateLabel(element, x, y) {
    if (!labelElement) {
      labelElement = createLabel();
    }

    labelElement.textContent = getElementDescription(element);
    labelElement.style.left = `${x + 15}px`;
    labelElement.style.top = `${y + 15}px`;
    labelElement.style.display = "block";
  }

  function hideLabel() {
    if (labelElement) {
      labelElement.style.display = "none";
    }
  }

  function onMouseOver(e) {
    if (!isActive) return;

    const target = e.target;
    if (
      target.closest(".agentation-toolbar") ||
      target.closest(".agentation-modal-overlay") ||
      target.closest(".agentation-popover") ||
      target.closest(".agentation-marker") ||
      target.closest(".agentation-settings-panel") ||
      target.classList.contains("agentation-label")
    ) {
      return;
    }

    if (hoveredElement) {
      hoveredElement.classList.remove("agentation-highlight");
    }

    hoveredElement = target;
    hoveredElement.classList.add("agentation-highlight");
    updateLabel(target, e.clientX, e.clientY);
  }

  function onMouseOut(e) {
    if (!isActive) return;

    if (hoveredElement) {
      hoveredElement.classList.remove("agentation-highlight");
      hoveredElement = null;
    }
    hideLabel();
  }

  function onMouseMove(e) {
    if (!isActive) return;

    if (isDragging && selectionBox) {
      updateSelectionBox(e.clientX, e.clientY);
      updateSelectedElements();
      return;
    }

    if (dragStartPos && !isDragging) {
      const dx = Math.abs(e.clientX - dragStartPos.x);
      const dy = Math.abs(e.clientY - dragStartPos.y);
      const DRAG_THRESHOLD = 5;

      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        startDragSelection(dragStartPos.x, dragStartPos.y);
        updateSelectionBox(e.clientX, e.clientY);
        return;
      }
    }

    if (!hoveredElement) return;
    updateLabel(hoveredElement, e.clientX, e.clientY);
  }

  function onMouseDown(e) {
    if (!isActive) return;

    const target = e.target;
    if (
      target.closest(".agentation-toolbar") ||
      target.closest(".agentation-modal-overlay") ||
      target.closest(".agentation-popover") ||
      target.closest(".agentation-marker") ||
      target.closest(".agentation-group-marker") ||
      target.closest(".agentation-settings-panel")
    ) {
      return;
    }

    dragStartPos = { x: e.clientX, y: e.clientY };
  }

  function onMouseUp(e) {
    if (!isActive) return;

    if (isDragging && selectedElements.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      justFinishedDrag = true;
      showMultiAnnotationModal(selectedElements);
    }

    cleanupDragSelection();
  }

  function startDragSelection(x, y) {
    isDragging = true;

    selectionBox = document.createElement("div");
    selectionBox.className = "agentation-selection-box";
    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = "0px";
    selectionBox.style.height = "0px";
    document.body.appendChild(selectionBox);

    if (hoveredElement) {
      hoveredElement.classList.remove("agentation-highlight");
      hoveredElement = null;
    }
    hideLabel();
  }

  function updateSelectionBox(currentX, currentY) {
    if (!selectionBox || !dragStartPos) return;

    const left = Math.min(dragStartPos.x, currentX);
    const top = Math.min(dragStartPos.y, currentY);
    const width = Math.abs(currentX - dragStartPos.x);
    const height = Math.abs(currentY - dragStartPos.y);

    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  }

  function updateSelectedElements() {
    if (!selectionBox) return;

    selectedElements.forEach((el) =>
      el.classList.remove("agentation-multi-highlight"),
    );
    selectedElements = [];

    const boxRect = selectionBox.getBoundingClientRect();
    if (boxRect.width < 10 || boxRect.height < 10) return;

    const elements = document.querySelectorAll(
      'body *:not([class*="agentation-"])',
    );

    elements.forEach((el) => {
      if (
        el.closest(".agentation-toolbar") ||
        el.closest(".agentation-modal-overlay") ||
        el.closest(".agentation-popover") ||
        el.closest(".agentation-settings-panel")
      ) {
        return;
      }

      const elRect = el.getBoundingClientRect();
      if (elRect.width === 0 || elRect.height === 0) return;

      const isIntersecting = !(
        elRect.right < boxRect.left ||
        elRect.left > boxRect.right ||
        elRect.bottom < boxRect.top ||
        elRect.top > boxRect.bottom
      );

      if (isIntersecting && isLeafElement(el)) {
        selectedElements.push(el);
        el.classList.add("agentation-multi-highlight");
      }
    });
  }

  function isLeafElement(el) {
    const children = Array.from(el.children).filter((child) => {
      const style = window.getComputedStyle(child);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    return (
      children.length === 0 ||
      el.tagName === "BUTTON" ||
      el.tagName === "A" ||
      el.tagName === "INPUT"
    );
  }

  function cleanupDragSelection() {
    isDragging = false;
    dragStartPos = null;

    if (selectionBox) {
      selectionBox.remove();
      selectionBox = null;
    }

    selectedElements.forEach((el) =>
      el.classList.remove("agentation-multi-highlight"),
    );
    selectedElements = [];
  }

  function showMultiAnnotationModal(elements) {
    const existingPopover = document.querySelector(".agentation-popover");
    if (existingPopover) {
      existingPopover.remove();
    }

    const selectors = elements.map((el) => getUniqueSelector(el));
    const descriptions = elements.map((el) => getElementDescription(el));

    const boundingBox = getGroupBoundingBox(elements);

    const overlay = document.createElement("div");
    overlay.className = "agentation-modal-overlay";

    const selectorListHtml = selectors
      .slice(0, 5)
      .map(
        (sel, i) =>
          `<div style="font-size: 11px; padding: 4px 8px; background: rgba(255,255,255,0.5); border-radius: 4px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1e293b;">${descriptions[i]}</div>`,
      )
      .join("");

    const moreCount =
      selectors.length > 5
        ? `<div style="font-size: 11px; color: #64748b; padding: 4px;">${t("moreElements", { count: selectors.length - 5 })}</div>`
        : "";

    overlay.innerHTML = `
      <div class="agentation-modal" style="max-width: 420px;">
        <div class="agentation-modal-header">
          <h3 class="agentation-modal-title">${t("groupAnnotation")} (${elements.length} ${t("elements")})</h3>
        </div>
        <div style="max-height: 150px; overflow-y: auto; margin-bottom: 16px;">
          ${selectorListHtml}
          ${moreCount}
        </div>
        <textarea class="agentation-modal-textarea" placeholder="${t("groupAnnotationPlaceholder")}" autofocus></textarea>
        <div class="agentation-modal-actions">
          <button class="agentation-btn agentation-btn-cancel">${t("cancel")}</button>
          <button class="agentation-btn agentation-btn-add">${t("add")}</button>
          <button class="agentation-btn agentation-btn-ai" style="background: #8b5cf6; color: white;">${t("directSendToAI")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const textarea = overlay.querySelector(".agentation-modal-textarea");
    const cancelBtn = overlay.querySelector(".agentation-btn-cancel");
    const addBtn = overlay.querySelector(".agentation-btn-add");
    const aiBtn = overlay.querySelector(".agentation-btn-ai");

    setTimeout(() => textarea.focus(), 10);

    const closeModal = () => {
      overlay.remove();
    };

    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    const addGroupAnnotation = () => {
      const feedback = textarea.value.trim();
      if (!feedback) {
        textarea.focus();
        return;
      }

      const annotation = {
        id: Date.now(),
        isGroup: true,
        selectors,
        descriptions,
        feedback,
        position: {
          top: boundingBox.top + window.scrollY,
          left: boundingBox.left + window.scrollX,
        },
        boundingBox: {
          top: boundingBox.top + window.scrollY,
          left: boundingBox.left + window.scrollX,
          width: boundingBox.width,
          height: boundingBox.height,
        },
        timestamp: new Date().toISOString(),
      };

      annotations.push(annotation);
      saveAnnotations();
      updateToolbarBadge();
      addGroupMarker(annotation);
      closeModal();
    };

    addBtn.addEventListener("click", addGroupAnnotation);

    aiBtn.addEventListener("click", async () => {
      const feedback = textarea.value.trim();
      if (!feedback) {
        textarea.focus();
        return;
      }

      aiBtn.disabled = true;
      aiBtn.textContent = t("sending");

      if (!mcpConnected && window.agentationWS) {
        try {
          await connectToMCP();
        } catch (error) {
          showToast(t("mcpConnectionFailed"));
          aiBtn.disabled = false;
          aiBtn.textContent = t("directSendToAI");
          return;
        }
      }

      if (!mcpConnected) {
        showToast(t("mcpDisconnected"));
        aiBtn.disabled = false;
        aiBtn.textContent = t("directSendToAI");
        return;
      }

      try {
        const tempAnnotation = [
          {
            id: Date.now(),
            isGroup: true,
            selectors,
            descriptions,
            feedback,
            position: {
              top: boundingBox.top + window.scrollY,
              left: boundingBox.left + window.scrollX,
            },
            boundingBox: {
              top: boundingBox.top + window.scrollY,
              left: boundingBox.left + window.scrollX,
              width: boundingBox.width,
              height: boundingBox.height,
            },
            timestamp: new Date().toISOString(),
          },
        ];

        let context = "";
        if (settings.includePlaywrightHint) {
          context = t("playwrightHintPrompt");
        }

        await window.agentationWS.submitFeedback(tempAnnotation, context);

        closeModal();
        showToast(t("sentToAI"));

        if (isActive) {
          isActive = false;
          chrome.runtime.sendMessage({ type: "SET_STATE", isActive: false });
          updateToolbarButtons();
          if (hoveredElement) {
            hoveredElement.classList.remove("agentation-highlight");
            hoveredElement = null;
            hideLabel();
          }
          if (settings.blockInteractions) {
            document.body.classList.remove("agentation-block-interactions");
          }
        }
      } catch (error) {
        showToast(t("sendFailed") + error.message);
        aiBtn.disabled = false;
        aiBtn.textContent = t("directSendToAI");
      }
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        addGroupAnnotation();
      }
      if (e.key === "Escape") {
        closeModal();
      }
    });
  }

  function getGroupBoundingBox(elements) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    });

    return {
      top: minY,
      left: minX,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  function onClick(e) {
    if (!isActive) return;

    if (isDragging || justFinishedDrag) {
      dragStartPos = null;
      justFinishedDrag = false;
      return;
    }

    dragStartPos = null;

    const target = e.target;
    if (
      target.closest(".agentation-toolbar") ||
      target.closest(".agentation-modal-overlay") ||
      target.closest(".agentation-popover") ||
      target.closest(".agentation-marker") ||
      target.closest(".agentation-group-marker") ||
      target.closest(".agentation-settings-panel")
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    showAnnotationModal(target);
  }

  function showAnnotationModal(element) {
    const existingPopover = document.querySelector(".agentation-popover");
    if (existingPopover) {
      existingPopover.remove();
    }

    const selector = getUniqueSelector(element);
    const rect = element.getBoundingClientRect();

    const popover = document.createElement("div");
    popover.className = "agentation-popover";

    popover.innerHTML = `
      <div class="agentation-popover-arrow"></div>
      <div class="agentation-modal-selector">${selector}</div>
      <textarea class="agentation-modal-textarea" placeholder="${t("directSendPlaceholder")}" autofocus></textarea>
      <div class="agentation-modal-actions">
        <button class="agentation-btn agentation-btn-cancel">${t("cancel")}</button>
        <button class="agentation-btn agentation-btn-add">${t("add")}</button>
        <button class="agentation-btn agentation-btn-ai" style="background: #8b5cf6; color: white;">${t("directSendToAI")}</button>
      </div>
    `;

    document.body.appendChild(popover);

    const popoverWidth = 320;
    const popoverHeight = 200;
    const padding = 12;
    const arrowSize = 8;

    let top, left;
    let arrowPosition = "top";

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.left;
    const spaceLeft = rect.right;

    if (spaceBelow >= popoverHeight + padding) {
      top = rect.bottom + window.scrollY + arrowSize;
      arrowPosition = "top";
    } else if (spaceAbove >= popoverHeight + padding) {
      top = rect.top + window.scrollY - popoverHeight - arrowSize;
      arrowPosition = "bottom";
    } else {
      top = Math.max(
        padding,
        Math.min(
          window.innerHeight - popoverHeight - padding,
          rect.top + window.scrollY + rect.height / 2 - popoverHeight / 2,
        ),
      );
      arrowPosition = "none";
    }

    left = rect.left + window.scrollX + rect.width / 2 - popoverWidth / 2;
    left = Math.max(
      padding,
      Math.min(window.innerWidth - popoverWidth - padding, left),
    );

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.dataset.arrow = arrowPosition;

    if (arrowPosition === "top" || arrowPosition === "bottom") {
      const arrow = popover.querySelector(".agentation-popover-arrow");
      const arrowLeft = rect.left + rect.width / 2 - left - arrowSize;
      arrow.style.left = `${Math.max(16, Math.min(popoverWidth - 32, arrowLeft))}px`;
    }

    const textarea = popover.querySelector(".agentation-modal-textarea");
    const cancelBtn = popover.querySelector(".agentation-btn-cancel");
    const addBtn = popover.querySelector(".agentation-btn-add");
    const aiBtn = popover.querySelector(".agentation-btn-ai");

    setTimeout(() => textarea.focus(), 10);

    const closeModal = () => {
      popover.remove();
      document.removeEventListener("click", handleOutsideClick, true);
      if (hoveredElement) {
        hoveredElement.classList.remove("agentation-highlight");
        hoveredElement = null;
      }
    };

    const handleOutsideClick = (e) => {
      if (!popover.contains(e.target) && e.target !== element) {
        closeModal();
      }
    };

    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick, true);
    }, 0);

    cancelBtn.addEventListener("click", closeModal);

    const addAnnotation = () => {
      const feedback = textarea.value.trim();
      if (!feedback) {
        textarea.focus();
        return;
      }

      const annotation = {
        id: Date.now(),
        selector,
        description: getElementDescription(element),
        feedback,
        position: {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
        },
        timestamp: new Date().toISOString(),
      };

      annotations.push(annotation);
      saveAnnotations();
      updateToolbarBadge();
      addMarker(annotation);
      closeModal();
    };

    addBtn.addEventListener("click", addAnnotation);

    aiBtn.addEventListener("click", async () => {
      const feedback = textarea.value.trim();
      if (!feedback) {
        textarea.focus();
        return;
      }

      aiBtn.disabled = true;
      aiBtn.textContent = t("sending");

      if (!mcpConnected && window.agentationWS) {
        try {
          await connectToMCP();
        } catch (error) {
          showToast(t("mcpConnectionFailed"));
          aiBtn.disabled = false;
          aiBtn.textContent = t("directSendToAI");
          return;
        }
      }

      if (!mcpConnected) {
        showToast(t("mcpDisconnected"));
        aiBtn.disabled = false;
        aiBtn.textContent = t("directSendToAI");
        return;
      }

      try {
        const tempAnnotation = [
          {
            id: Date.now(),
            selector,
            description: getElementDescription(element),
            feedback,
            position: {
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
            },
            timestamp: new Date().toISOString(),
          },
        ];

        let context = "";
        if (settings.includePlaywrightHint) {
          context = t("playwrightHintPrompt");
        }

        await window.agentationWS.submitFeedback(tempAnnotation, context);

        closeModal();
        showToast(t("sentToAI"));

        if (isActive) {
          isActive = false;
          chrome.runtime.sendMessage({ type: "SET_STATE", isActive: false });
          updateToolbarButtons();
          if (hoveredElement) {
            hoveredElement.classList.remove("agentation-highlight");
            hoveredElement = null;
            hideLabel();
          }
          if (settings.blockInteractions) {
            document.body.classList.remove("agentation-block-interactions");
          }
        }
      } catch (error) {
        showToast(t("sendFailed") + error.message);
        aiBtn.disabled = false;
        aiBtn.textContent = t("directSendToAI");
      }
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        addAnnotation();
      }
      if (e.key === "Escape") {
        closeModal();
      }
    });
  }

  function addMarker(annotation) {
    if (annotation.isGroup) {
      addGroupMarker(annotation);
      return;
    }

    const marker = document.createElement("div");
    marker.className = "agentation-marker";
    marker.textContent = annotations.indexOf(annotation) + 1;

    const position =
      getElementPosition(annotation.selector) || annotation.position;
    marker.style.top = `${position.top - 12}px`;
    marker.style.left = `${position.left - 12}px`;
    marker.style.background = settings.markerColor;
    marker.style.display = markersHidden ? "none" : "flex";
    marker.dataset.annotationId = annotation.id;

    marker.addEventListener("click", (e) => {
      e.stopPropagation();
      showAnnotationDetail(annotation);
    });

    document.body.appendChild(marker);
  }

  function addGroupMarker(annotation) {
    const marker = document.createElement("div");
    marker.className = "agentation-group-marker";

    const index = annotations.indexOf(annotation) + 1;
    marker.innerHTML = `${index}<span class="agentation-group-marker-count">${annotation.selectors.length}</span>`;

    const position = annotation.position || annotation.boundingBox;
    marker.style.top = `${position.top - 14}px`;
    marker.style.left = `${position.left - 14}px`;
    marker.style.display = markersHidden ? "none" : "flex";
    marker.dataset.annotationId = annotation.id;

    marker.addEventListener("click", (e) => {
      e.stopPropagation();
      showGroupAnnotationDetail(annotation);
    });

    document.body.appendChild(marker);
  }

  function showGroupAnnotationDetail(annotation) {
    const overlay = document.createElement("div");
    overlay.className = "agentation-modal-overlay";

    const selectorListHtml = annotation.selectors
      .map(
        (sel, i) =>
          `<div style="font-size: 11px; padding: 6px 8px; background: rgba(255,255,255,0.5); border-radius: 4px; margin-bottom: 4px;">
        <div style="font-weight: 500; color: #1e293b; margin-bottom: 2px;">${annotation.descriptions[i]}</div>
        <div style="color: #64748b; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sel}</div>
      </div>`,
      )
      .join("");

    overlay.innerHTML = `
      <div class="agentation-modal" style="max-width: 450px; max-height: 80vh; display: flex; flex-direction: column;">
        <div class="agentation-modal-header">
          <h3 class="agentation-modal-title">${t("groupAnnotation")} #${annotations.indexOf(annotation) + 1} (${annotation.selectors.length} ${t("elements")})</h3>
        </div>
        <div style="max-height: 200px; overflow-y: auto; margin-bottom: 16px; padding: 4px;">
          ${selectorListHtml}
        </div>
        <div class="agentation-feedback-display" style="padding: 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 16px; flex-shrink: 0;">
          ${annotation.feedback}
        </div>
        <div class="agentation-edit-container" style="display: none; margin-bottom: 16px;">
          <textarea class="agentation-modal-textarea agentation-edit-textarea" style="min-height: 100px;">${annotation.feedback}</textarea>
        </div>
        <div class="agentation-modal-actions">
          <button class="agentation-btn agentation-btn-cancel" data-action="delete" style="background: #fee2e2; color: #dc2626;">${t("delete")}</button>
          <button class="agentation-btn agentation-btn-cancel" data-action="edit" style="background: #dbeafe; color: #2563eb;">${t("edit")}</button>
          <button class="agentation-btn agentation-btn-add" data-action="save" style="display: none;">${t("save")}</button>
          <button class="agentation-btn agentation-btn-cancel" data-action="cancel-edit" style="display: none;">${t("cancel")}</button>
          <button class="agentation-btn agentation-btn-cancel" data-action="close">${t("close")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const deleteBtn = overlay.querySelector('[data-action="delete"]');
    const editBtn = overlay.querySelector('[data-action="edit"]');
    const saveBtn = overlay.querySelector('[data-action="save"]');
    const cancelEditBtn = overlay.querySelector('[data-action="cancel-edit"]');
    const closeBtn = overlay.querySelector('[data-action="close"]');
    const feedbackDisplay = overlay.querySelector(
      ".agentation-feedback-display",
    );
    const editContainer = overlay.querySelector(".agentation-edit-container");
    const editTextarea = overlay.querySelector(".agentation-edit-textarea");

    const closeModal = () => overlay.remove();

    const enterEditMode = () => {
      feedbackDisplay.style.display = "none";
      editContainer.style.display = "block";
      deleteBtn.style.display = "none";
      editBtn.style.display = "none";
      closeBtn.style.display = "none";
      saveBtn.style.display = "inline-flex";
      cancelEditBtn.style.display = "inline-flex";
      editTextarea.focus();
    };

    const exitEditMode = () => {
      feedbackDisplay.style.display = "block";
      editContainer.style.display = "none";
      deleteBtn.style.display = "inline-flex";
      editBtn.style.display = "inline-flex";
      closeBtn.style.display = "inline-flex";
      saveBtn.style.display = "none";
      cancelEditBtn.style.display = "none";
      editTextarea.value = annotation.feedback;
    };

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    editBtn.addEventListener("click", enterEditMode);
    cancelEditBtn.addEventListener("click", exitEditMode);

    saveBtn.addEventListener("click", () => {
      const newFeedback = editTextarea.value.trim();
      if (!newFeedback) {
        editTextarea.focus();
        return;
      }

      annotation.feedback = newFeedback;
      saveAnnotations();
      feedbackDisplay.textContent = newFeedback;
      exitEditMode();
      showToast(t("annotationUpdated"));
    });

    editTextarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        saveBtn.click();
      }
      if (e.key === "Escape") {
        exitEditMode();
      }
    });

    deleteBtn.addEventListener("click", () => {
      showDeleteConfirm(annotation, () => {
        const index = annotations.findIndex((a) => a.id === annotation.id);
        if (index !== -1) {
          annotations.splice(index, 1);
          saveAnnotations();
          updateToolbarBadge();

          const marker = document.querySelector(
            `[data-annotation-id="${annotation.id}"]`,
          );
          if (marker) marker.remove();

          refreshMarkers();
        }
        closeModal();
      });
    });
  }

  function showAnnotationDetail(annotation) {
    const overlay = document.createElement("div");
    overlay.className = "agentation-modal-overlay";

    overlay.innerHTML = `
      <div class="agentation-modal">
        <div class="agentation-modal-header">
          <h3 class="agentation-modal-title">${t("annotation")} #${annotations.indexOf(annotation) + 1}</h3>
        </div>
        <div class="agentation-modal-selector">${annotation.selector}</div>
        <div class="agentation-feedback-display" style="padding: 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 16px;">
          ${annotation.feedback}
        </div>
        <div class="agentation-edit-container" style="display: none; margin-bottom: 16px;">
          <textarea class="agentation-modal-textarea agentation-edit-textarea" style="min-height: 100px;">${annotation.feedback}</textarea>
        </div>
        <div class="agentation-modal-actions">
          <button class="agentation-btn agentation-btn-cancel" data-action="delete" style="background: #fee2e2; color: #dc2626;">${t("delete")}</button>
          <button class="agentation-btn agentation-btn-cancel" data-action="edit" style="background: #dbeafe; color: #2563eb;">${t("edit")}</button>
          <button class="agentation-btn agentation-btn-add" data-action="save" style="display: none;">${t("save")}</button>
          <button class="agentation-btn agentation-btn-cancel" data-action="cancel-edit" style="display: none;">${t("cancel")}</button>
          <button class="agentation-btn agentation-btn-cancel" data-action="close">${t("close")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const deleteBtn = overlay.querySelector('[data-action="delete"]');
    const editBtn = overlay.querySelector('[data-action="edit"]');
    const saveBtn = overlay.querySelector('[data-action="save"]');
    const cancelEditBtn = overlay.querySelector('[data-action="cancel-edit"]');
    const closeBtn = overlay.querySelector('[data-action="close"]');
    const feedbackDisplay = overlay.querySelector(
      ".agentation-feedback-display",
    );
    const editContainer = overlay.querySelector(".agentation-edit-container");
    const editTextarea = overlay.querySelector(".agentation-edit-textarea");

    const closeModal = () => overlay.remove();

    const enterEditMode = () => {
      feedbackDisplay.style.display = "none";
      editContainer.style.display = "block";
      deleteBtn.style.display = "none";
      editBtn.style.display = "none";
      closeBtn.style.display = "none";
      saveBtn.style.display = "inline-flex";
      cancelEditBtn.style.display = "inline-flex";
      editTextarea.focus();
    };

    const exitEditMode = () => {
      feedbackDisplay.style.display = "block";
      editContainer.style.display = "none";
      deleteBtn.style.display = "inline-flex";
      editBtn.style.display = "inline-flex";
      closeBtn.style.display = "inline-flex";
      saveBtn.style.display = "none";
      cancelEditBtn.style.display = "none";
      editTextarea.value = annotation.feedback;
    };

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    editBtn.addEventListener("click", enterEditMode);
    cancelEditBtn.addEventListener("click", exitEditMode);

    saveBtn.addEventListener("click", () => {
      const newFeedback = editTextarea.value.trim();
      if (!newFeedback) {
        editTextarea.focus();
        return;
      }

      annotation.feedback = newFeedback;
      saveAnnotations();
      feedbackDisplay.textContent = newFeedback;
      exitEditMode();
      showToast(t("annotationUpdated"));
    });

    editTextarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        saveBtn.click();
      }
      if (e.key === "Escape") {
        exitEditMode();
      }
    });

    deleteBtn.addEventListener("click", () => {
      showDeleteConfirm(annotation, () => {
        const index = annotations.findIndex((a) => a.id === annotation.id);
        if (index !== -1) {
          annotations.splice(index, 1);
          saveAnnotations();
          updateToolbarBadge();

          const marker = document.querySelector(
            `[data-annotation-id="${annotation.id}"]`,
          );
          if (marker) marker.remove();

          refreshMarkers();
        }
        closeModal();
      });
    });
  }

  function showDeleteConfirm(annotation, onConfirm) {
    const confirmOverlay = document.createElement("div");
    confirmOverlay.className = "agentation-modal-overlay";
    confirmOverlay.style.background = "rgba(0, 0, 0, 0.3)";

    confirmOverlay.innerHTML = `
      <div class="agentation-modal" style="max-width: 280px; text-align: center;">
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #1e293b;">${t("deleteConfirmTitle")}</div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 16px;">${t("deleteConfirmMessage")}</div>
        <div class="agentation-modal-actions" style="justify-content: center;">
          <button class="agentation-btn agentation-btn-cancel" data-action="cancel">${t("cancel")}</button>
          <button class="agentation-btn" data-action="confirm" style="background: #dc2626; color: white;">${t("delete")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmOverlay);

    const cancelBtn = confirmOverlay.querySelector('[data-action="cancel"]');
    const confirmBtn = confirmOverlay.querySelector('[data-action="confirm"]');

    const closeConfirm = () => confirmOverlay.remove();

    cancelBtn.addEventListener("click", closeConfirm);
    confirmOverlay.addEventListener("click", (e) => {
      if (e.target === confirmOverlay) closeConfirm();
    });

    confirmBtn.addEventListener("click", () => {
      closeConfirm();
      onConfirm();
    });
  }

  function refreshMarkers() {
    document
      .querySelectorAll(".agentation-marker, .agentation-group-marker")
      .forEach((m) => m.remove());
    annotations.forEach(addMarker);
  }

  function saveAnnotations() {
    chrome.runtime.sendMessage({ type: "SAVE_ANNOTATIONS", annotations });
  }

  function loadAnnotations() {
    chrome.runtime.sendMessage({ type: "GET_ANNOTATIONS" }, (response) => {
      if (response?.annotations) {
        annotations = response.annotations;
        updateToolbarBadge();
        refreshMarkers();
      }
    });
  }

  function generateMarkdown() {
    if (annotations.length === 0) return "";

    let md = `# UI Annotations\n\n`;
    md += `**Page:** ${window.location.href}\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    md += `---\n\n`;

    annotations.forEach((annotation, index) => {
      if (annotation.isGroup) {
        md += `## ${index + 1}. Group (${annotation.selectors.length} elements)\n\n`;
        md += `**Elements:**\n`;
        annotation.selectors.forEach((sel, i) => {
          md += `- ${annotation.descriptions[i]}: \`${sel}\`\n`;
        });
        md += `\n`;

        if (settings.outputDetail === "detailed") {
          md += `**Bounding Box:** top: ${Math.round(annotation.boundingBox.top)}px, left: ${Math.round(annotation.boundingBox.left)}px, ${Math.round(annotation.boundingBox.width)}x${Math.round(annotation.boundingBox.height)}px\n\n`;
          md += `**Timestamp:** ${annotation.timestamp}\n\n`;
        }
      } else {
        md += `## ${index + 1}. ${annotation.description}\n\n`;
        md += `**Selector:** \`${annotation.selector}\`\n\n`;

        if (settings.outputDetail === "detailed") {
          md += `**Position:** top: ${Math.round(annotation.position.top)}px, left: ${Math.round(annotation.position.left)}px\n\n`;
          md += `**Timestamp:** ${annotation.timestamp}\n\n`;
        }
      }

      md += `**Feedback:**\n${annotation.feedback}\n\n`;
      md += `---\n\n`;
    });

    return md;
  }

  async function copyToClipboard() {
    const md = generateMarkdown();
    if (!md) {
      showToast(t("noAnnotations"));
      return;
    }

    try {
      await navigator.clipboard.writeText(md);
      showToast(t("copiedAnnotations", { count: annotations.length }));

      if (settings.clearAfterCopy) {
        annotations = [];
        saveAnnotations();
        updateToolbarBadge();
        document
          .querySelectorAll(".agentation-marker, .agentation-group-marker")
          .forEach((m) => m.remove());
      }
    } catch (err) {
      showToast(t("copyFailed"));
    }
  }

  let mcpConnected = false;
  let mcpConnecting = false;

  function updateMCPStatus(connected) {
    mcpConnected = connected;
    const statusIndicator = toolbar?.querySelector(".agentation-mcp-status");
    const aiBtn = toolbar?.querySelector('[data-action="send-to-ai"]');

    if (statusIndicator) {
      statusIndicator.style.display = "block";
      statusIndicator.style.background = connected ? "#22c55e" : "#ef4444";
      statusIndicator.title = connected
        ? t("mcpConnected")
        : t("mcpDisconnected");
    }

    if (aiBtn) {
      aiBtn.classList.toggle("connected", connected);
    }
  }

  async function connectToMCP(silent = false) {
    if (mcpConnecting || mcpConnected) return;

    mcpConnecting = true;

    try {
      if (window.agentationWS) {
        window.agentationWS.onStatusChange = (status) => {
          updateMCPStatus(status.connected);
        };

        window.agentationWS.onFeedbackResult = null;

        await window.agentationWS.connect(undefined, silent);
        updateMCPStatus(true);
      }
    } catch {
      updateMCPStatus(false);
    } finally {
      mcpConnecting = false;
    }
  }

  async function sendToAI() {
    if (annotations.length === 0) {
      showToast(t("pleasAddFeedback"));
      return;
    }

    if (!mcpConnected && window.agentationWS) {
      showToast(t("mcpConnecting"));
      try {
        await connectToMCP();
      } catch (error) {
        showToast(t("mcpConnectionFailed"));
        return;
      }
    }

    showSendToAIModal();
  }

  function showSendToAIModal() {
    const overlay = document.createElement("div");
    overlay.className = "agentation-modal-overlay";

    const connectionStatus = mcpConnected
      ? `<span style="color: #22c55e;">● ${t("mcpConnected")}</span>`
      : `<span style="color: #ef4444;">● ${t("mcpDisconnected")}</span>`;

    overlay.innerHTML = `
      <div class="agentation-modal" style="max-width: 450px;">
        <div class="agentation-modal-header">
          <h3 class="agentation-modal-title">${t("sendToAITitle")}</h3>
        </div>
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
            ${connectionStatus}
          </div>
          <div style="font-size: 14px; margin-bottom: 12px; color: #1e293b;">
            <strong>${annotations.length}</strong> ${t("annotationsToSend")}
          </div>
          <div style="max-height: 150px; overflow-y: auto; background: #f8fafc; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            ${annotations
              .map((a, i) => {
                const desc = a.isGroup
                  ? `${t("group")} (${a.selectors.length} ${t("elements")})`
                  : a.description;
                return `<div style="font-size: 12px; padding: 4px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
                <strong>${i + 1}.</strong> ${desc}
                <div style="color: #475569; margin-top: 2px;">${a.feedback.slice(0, 50)}${a.feedback.length > 50 ? "..." : ""}</div>
              </div>`;
              })
              .join("")}
          </div>
          <textarea class="agentation-modal-textarea" placeholder="${t("additionalContextPlaceholder")}" style="min-height: 60px;"></textarea>
        </div>
        <div class="agentation-modal-actions">
          <button class="agentation-btn agentation-btn-cancel" data-action="cancel">${t("cancel")}</button>
          ${
            mcpConnected
              ? `<button class="agentation-btn agentation-btn-add" data-action="send">${t("send")}</button>`
              : `<button class="agentation-btn" data-action="copy-instead" style="background: #3b82f6; color: white;">${t("copyInstead")}</button>`
          }
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const textarea = overlay.querySelector(".agentation-modal-textarea");
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');
    const sendBtn = overlay.querySelector('[data-action="send"]');
    const copyInsteadBtn = overlay.querySelector(
      '[data-action="copy-instead"]',
    );

    const closeModal = () => overlay.remove();

    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    if (sendBtn) {
      sendBtn.addEventListener("click", async () => {
        sendBtn.disabled = true;
        sendBtn.textContent = t("sending");

        try {
          let additionalContext = textarea.value.trim();
          if (settings.includePlaywrightHint) {
            const playwrightHint = t("playwrightHintPrompt");
            additionalContext = additionalContext
              ? `${playwrightHint}\n\n${additionalContext}`
              : playwrightHint;
          }
          await window.agentationWS.submitFeedback(
            annotations,
            additionalContext,
          );

          closeModal();
          showToast(t("sentToAI"));

          // Deactivate annotation mode for Playwriter to work properly
          if (isActive) {
            isActive = false;
            chrome.runtime.sendMessage({ type: "SET_STATE", isActive: false });
            updateToolbarButtons();
            if (hoveredElement) {
              hoveredElement.classList.remove("agentation-highlight");
              hoveredElement = null;
              hideLabel();
            }
            if (settings.blockInteractions) {
              document.body.classList.remove("agentation-block-interactions");
            }
          }

          if (settings.clearAfterCopy) {
            annotations = [];
            saveAnnotations();
            updateToolbarBadge();
            document
              .querySelectorAll(".agentation-marker, .agentation-group-marker")
              .forEach((m) => m.remove());
          }
        } catch (error) {
          showToast(t("sendFailed") + error.message);
          sendBtn.disabled = false;
          sendBtn.textContent = t("send");
        }
      });
    }

    if (copyInsteadBtn) {
      copyInsteadBtn.addEventListener("click", async () => {
        await copyToClipboard();
        closeModal();
      });
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "agentation-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    void toast.offsetWidth;
    toast.classList.add("visible");

    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  function toggleAnimations() {
    animationsPaused = !animationsPaused;
    document.body.classList.toggle(
      "agentation-animations-paused",
      animationsPaused,
    );
    updateToolbarButtons();
  }

  function toggleMarkers() {
    markersHidden = !markersHidden;
    document
      .querySelectorAll(".agentation-marker, .agentation-group-marker")
      .forEach((marker) => {
        marker.style.display = markersHidden ? "none" : "flex";
      });
    updateToolbarButtons();
  }

  function toggleToolbarExpand() {
    toolbarExpanded = !toolbarExpanded;
    toolbar.classList.toggle("collapsed", !toolbarExpanded);
  }

  function showSettingsPanel() {
    const existingPanel = document.querySelector(".agentation-settings-panel");
    if (existingPanel) {
      existingPanel.remove();
      return;
    }

    const toolbarRect = toolbar.getBoundingClientRect();

    const panel = document.createElement("div");
    panel.className = "agentation-settings-panel";

    panel.innerHTML = `
      <div class="agentation-settings-header">
        <span class="agentation-settings-title">${t("settingsTitle")}</span>
      </div>
      <div class="agentation-settings-group">
        <label class="agentation-settings-label">${t("language")}</label>
        <select class="agentation-settings-select" data-setting="language">
          <option value="en" ${settings.language === "en" ? "selected" : ""}>English</option>
          <option value="ko" ${settings.language === "ko" ? "selected" : ""}>한국어</option>
        </select>
      </div>
      <div class="agentation-settings-group">
        <label class="agentation-settings-label">${t("outputDetail")}</label>
        <select class="agentation-settings-select" data-setting="outputDetail">
          <option value="standard" ${settings.outputDetail === "standard" ? "selected" : ""}>${t("standard")}</option>
          <option value="detailed" ${settings.outputDetail === "detailed" ? "selected" : ""}>${t("detailed")}</option>
        </select>
      </div>
      <div class="agentation-settings-group">
        <label class="agentation-settings-label">${t("markerColor")}</label>
        <div class="agentation-color-options">
          <button class="agentation-color-btn ${settings.markerColor === "#ef4444" ? "active" : ""}" data-color="#ef4444" style="background: #ef4444;"></button>
          <button class="agentation-color-btn ${settings.markerColor === "#f97316" ? "active" : ""}" data-color="#f97316" style="background: #f97316;"></button>
          <button class="agentation-color-btn ${settings.markerColor === "#eab308" ? "active" : ""}" data-color="#eab308" style="background: #eab308;"></button>
          <button class="agentation-color-btn ${settings.markerColor === "#22c55e" ? "active" : ""}" data-color="#22c55e" style="background: #22c55e;"></button>
          <button class="agentation-color-btn ${settings.markerColor === "#3b82f6" ? "active" : ""}" data-color="#3b82f6" style="background: #3b82f6;"></button>
          <button class="agentation-color-btn ${settings.markerColor === "#a855f7" ? "active" : ""}" data-color="#a855f7" style="background: #a855f7;"></button>
        </div>
      </div>
      <div class="agentation-settings-group">
        <label class="agentation-settings-checkbox">
          <input type="checkbox" data-setting="clearAfterCopy" ${settings.clearAfterCopy ? "checked" : ""}>
          <span>${t("clearAfterCopy")}</span>
        </label>
      </div>
      <div class="agentation-settings-group">
        <label class="agentation-settings-checkbox">
          <input type="checkbox" data-setting="blockInteractions" ${settings.blockInteractions ? "checked" : ""}>
          <span>${t("blockInteractions")}</span>
        </label>
      </div>
      <div class="agentation-settings-group">
        <label class="agentation-settings-checkbox">
          <input type="checkbox" data-setting="includePlaywrightHint" ${settings.includePlaywrightHint ? "checked" : ""}>
          <span>${t("includePlaywrightHint")}</span>
        </label>
      </div>
    `;

    panel.style.bottom = `${window.innerHeight - toolbarRect.top + 8}px`;
    panel.style.right = "20px";

    document.body.appendChild(panel);

    panel.querySelectorAll(".agentation-settings-select").forEach((select) => {
      select.addEventListener("change", (e) => {
        const setting = e.target.dataset.setting;
        settings[setting] = e.target.value;

        if (setting === "language") {
          window.agentationI18n?.setLanguage(e.target.value);
          updateToolbarTitles();
          saveSettings();
          panel.remove();
          showSettingsPanel();
          return;
        }

        saveSettings();
      });
    });

    panel.querySelectorAll(".agentation-color-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.markerColor = btn.dataset.color;
        panel
          .querySelectorAll(".agentation-color-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyMarkerColor();
        saveSettings();
      });
    });

    panel.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        settings[e.target.dataset.setting] = e.target.checked;
        if (e.target.dataset.setting === "blockInteractions") {
          document.body.classList.toggle(
            "agentation-block-interactions",
            settings.blockInteractions && isActive,
          );
        }
        saveSettings();
      });
    });

    const closePanel = (e) => {
      if (
        !panel.contains(e.target) &&
        !e.target.closest('[data-action="settings"]')
      ) {
        panel.remove();
        document.removeEventListener("click", closePanel, true);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closePanel, true);
    }, 0);
  }

  function applyMarkerColor() {
    document.querySelectorAll(".agentation-marker").forEach((marker) => {
      marker.style.background = settings.markerColor;
    });
  }

  function saveSettings() {
    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings });
  }

  function loadSettings() {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
      if (response?.settings) {
        settings = { ...settings, ...response.settings };
        applyMarkerColor();
        if (settings.language) {
          window.agentationI18n?.setLanguage(settings.language);
          updateToolbarTitles();
        }
      }
    });
  }

  function updateToolbarTitles() {
    if (!toolbar) return;

    const titleMap = {
      expand: "openAgentation",
      toggle: "toggleAgentation",
      copy: "copyToClipboard",
      "send-to-ai": "sendToAI",
      visibility: "toggleMarkers",
      pause: "pauseAnimations",
      clear: "clearAll",
      settings: "settings",
      collapse: "closeToolbar",
    };

    Object.entries(titleMap).forEach(([action, key]) => {
      const btn = toolbar.querySelector(`[data-action="${action}"]`);
      if (btn) {
        btn.title = t(key);
      }
    });
  }

  function createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.className = "agentation-toolbar collapsed";

    toolbar.innerHTML = `
      <button class="agentation-toolbar-btn agentation-expand-btn" data-action="expand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </button>
      <div class="agentation-toolbar-buttons">
        <button class="agentation-toolbar-btn" data-action="toggle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="agentation-toolbar-btn" data-action="copy" style="position: relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          <span class="agentation-toolbar-badge" style="display: none;">0</span>
        </button>
        <button class="agentation-toolbar-btn agentation-ai-btn" data-action="send-to-ai" style="position: relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span class="agentation-mcp-status" style="display: none;"></span>
        </button>
        <button class="agentation-toolbar-btn" data-action="visibility">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="agentation-toolbar-btn" data-action="pause">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        </button>
        <button class="agentation-toolbar-btn" data-action="settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
        <button class="agentation-toolbar-btn" data-action="clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
        <button class="agentation-toolbar-btn" data-action="collapse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toolbar);

    toolbar.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;

      switch (action) {
        case "expand":
          toggleToolbarExpand();
          break;
        case "collapse":
          toggleToolbarExpand();
          break;
        case "toggle":
          toggleActive();
          break;
        case "copy":
          copyToClipboard();
          break;
        case "send-to-ai":
          sendToAI();
          break;
        case "visibility":
          toggleMarkers();
          break;
        case "pause":
          toggleAnimations();
          break;
        case "clear":
          showAnnotationListModal();
          break;
        case "settings":
          showSettingsPanel();
          break;
      }
    });

    return toolbar;
  }

  function toggleActive() {
    isActive = !isActive;
    chrome.runtime.sendMessage({ type: "SET_STATE", isActive });
    updateToolbarButtons();

    if (settings.blockInteractions) {
      document.body.classList.toggle("agentation-block-interactions", isActive);
    }

    if (!isActive && hoveredElement) {
      hoveredElement.classList.remove("agentation-highlight");
      hoveredElement = null;
      hideLabel();
    }
  }

  function updateToolbarButtons() {
    const toggleBtn = toolbar?.querySelector('[data-action="toggle"]');
    const visibilityBtn = toolbar?.querySelector('[data-action="visibility"]');
    const pauseBtn = toolbar?.querySelector('[data-action="pause"]');

    if (toggleBtn) {
      toggleBtn.classList.toggle("active", isActive);
    }
    if (visibilityBtn) {
      visibilityBtn.classList.toggle("active", !markersHidden);
    }
    if (pauseBtn) {
      pauseBtn.classList.toggle("active", animationsPaused);
    }
  }

  function updateToolbarBadge() {
    const badge = toolbar?.querySelector(".agentation-toolbar-badge");
    if (badge) {
      badge.textContent = annotations.length;
      badge.style.display = annotations.length > 0 ? "flex" : "none";
    }
  }

  function showAnnotationListModal() {
    if (annotations.length === 0) {
      showToast(t("noAnnotationsToManage"));
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "agentation-modal-overlay";

    const renderList = () => {
      const listHtml = annotations
        .map((annotation, index) => {
          const desc = annotation.isGroup
            ? `${t("group")} (${annotation.selectors.length} ${t("elements")})`
            : annotation.description;
          const numberStyle = annotation.isGroup
            ? "background: rgba(59, 130, 246, 0.8);"
            : "";

          return `
          <div class="agentation-list-item" data-id="${annotation.id}">
            <div class="agentation-list-item-header">
              <span class="agentation-list-item-number" style="${numberStyle}">${index + 1}</span>
              <span class="agentation-list-item-desc">${desc}</span>
            </div>
            <div class="agentation-list-item-feedback">${annotation.feedback}</div>
            <div class="agentation-list-item-actions">
              <button class="agentation-btn agentation-btn-small" data-action="edit" style="background: #dbeafe; color: #2563eb;">${t("edit")}</button>
              <button class="agentation-btn agentation-btn-small" data-action="delete" style="background: #fee2e2; color: #dc2626;">${t("delete")}</button>
            </div>
          </div>
        `;
        })
        .join("");

      return listHtml;
    };

    overlay.innerHTML = `
      <div class="agentation-modal" style="max-width: 400px; max-height: 80vh; display: flex; flex-direction: column;">
        <div class="agentation-modal-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="agentation-modal-title">${t("annotations")} (${annotations.length})</h3>
        </div>
        <div class="agentation-list-container" style="flex: 1; overflow-y: auto; margin: 12px 0;">
          ${renderList()}
        </div>
        <div class="agentation-modal-actions" style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <button class="agentation-btn agentation-btn-cancel" data-action="clear-all" style="background: #fee2e2; color: #dc2626;">${t("clearAllAnnotations")}</button>
          <button class="agentation-btn agentation-btn-cancel" data-action="close">${t("close")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const modal = overlay.querySelector(".agentation-modal");
    const listContainer = overlay.querySelector(".agentation-list-container");
    const closeBtn = overlay.querySelector('[data-action="close"]');
    const clearAllBtn = overlay.querySelector('[data-action="clear-all"]');

    const closeModal = () => overlay.remove();

    const refreshList = () => {
      if (annotations.length === 0) {
        closeModal();
        showToast(t("allAnnotationsCleared"));
        return;
      }
      listContainer.innerHTML = renderList();
      modal.querySelector(".agentation-modal-title").textContent =
        `${t("annotations")} (${annotations.length})`;
      attachListItemHandlers();
    };

    const deleteAnnotation = (id) => {
      showDeleteConfirm(
        annotations.find((a) => a.id === id),
        () => {
          const index = annotations.findIndex((a) => a.id === id);
          if (index !== -1) {
            annotations.splice(index, 1);
            saveAnnotations();
            updateToolbarBadge();

            const marker = document.querySelector(
              `[data-annotation-id="${id}"]`,
            );
            if (marker) marker.remove();

            refreshMarkers();
            refreshList();
          }
        },
      );
    };

    const editAnnotation = (id) => {
      const annotation = annotations.find((a) => a.id === id);
      if (!annotation) return;

      const item = listContainer.querySelector(`[data-id="${id}"]`);
      const feedbackEl = item.querySelector(".agentation-list-item-feedback");
      const actionsEl = item.querySelector(".agentation-list-item-actions");

      feedbackEl.style.display = "none";
      actionsEl.style.display = "none";

      const editForm = document.createElement("div");
      editForm.className = "agentation-list-item-edit";
      editForm.innerHTML = `
        <textarea class="agentation-modal-textarea" style="min-height: 60px; margin-bottom: 8px;">${annotation.feedback}</textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="agentation-btn agentation-btn-small agentation-btn-cancel">${t("cancel")}</button>
          <button class="agentation-btn agentation-btn-small agentation-btn-add">${t("save")}</button>
        </div>
      `;

      item.appendChild(editForm);

      const textarea = editForm.querySelector("textarea");
      const saveBtn = editForm.querySelector(".agentation-btn-add");
      const cancelBtn = editForm.querySelector(".agentation-btn-cancel");

      textarea.focus();

      const exitEdit = () => {
        editForm.remove();
        feedbackEl.style.display = "block";
        actionsEl.style.display = "flex";
      };

      cancelBtn.addEventListener("click", exitEdit);

      saveBtn.addEventListener("click", () => {
        const newFeedback = textarea.value.trim();
        if (!newFeedback) {
          textarea.focus();
          return;
        }

        annotation.feedback = newFeedback;
        saveAnnotations();
        feedbackEl.textContent = newFeedback;
        exitEdit();
        showToast(t("annotationUpdated"));
      });

      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          saveBtn.click();
        }
        if (e.key === "Escape") {
          exitEdit();
        }
      });
    };

    const attachListItemHandlers = () => {
      listContainer
        .querySelectorAll(".agentation-list-item")
        .forEach((item) => {
          const id = parseInt(item.dataset.id);

          item
            .querySelector('[data-action="edit"]')
            .addEventListener("click", () => editAnnotation(id));
          item
            .querySelector('[data-action="delete"]')
            .addEventListener("click", () => deleteAnnotation(id));
        });
    };

    attachListItemHandlers();

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    clearAllBtn.addEventListener("click", () => {
      showDeleteConfirm({ feedback: "all annotations" }, () => {
        annotations = [];
        saveAnnotations();
        updateToolbarBadge();
        document
          .querySelectorAll(".agentation-marker, .agentation-group-marker")
          .forEach((m) => m.remove());
        closeModal();
        showToast(t("allAnnotationsCleared"));
      });
    });
  }

  function init() {
    toolbar = createToolbar();
    updateToolbarTitles();
    updateToolbarButtons();

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("click", onClick, true);

    window.addEventListener("scroll", throttledUpdateMarkerPositions, true);
    window.addEventListener("resize", throttledUpdateMarkerPositions);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "STATE_CHANGED") {
        isActive = message.isActive;
        updateToolbarButtons();
      }
      if (message.type === "GET_ANNOTATIONS_FROM_CONTENT") {
        sendResponse({ annotations });
        return true;
      }
      if (message.type === "UPDATE_ANNOTATION") {
        const annotation = annotations.find((a) => a.id === message.id);
        if (annotation) {
          annotation.feedback = message.feedback;
          saveAnnotations();
        }
        sendResponse({ success: true });
        return true;
      }
      if (message.type === "DELETE_ANNOTATION") {
        const index = annotations.findIndex((a) => a.id === message.id);
        if (index !== -1) {
          annotations.splice(index, 1);
          saveAnnotations();
          updateToolbarBadge();

          const marker = document.querySelector(
            `[data-annotation-id="${message.id}"]`,
          );
          if (marker) marker.remove();

          refreshMarkers();
        }
        sendResponse({ success: true });
        return true;
      }
    });

    chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
      isActive = response?.isActive ?? false;
      updateToolbarButtons();
    });

    loadAnnotations();
    loadSettings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
