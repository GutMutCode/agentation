(function () {
  "use strict";

  const translations = {
    en: {
      // Toolbar titles
      openAgentation: "Open Agentation",
      toggleAgentation: "Toggle Agentation",
      copyToClipboard: "Copy to Clipboard",
      sendToAI: "Send to AI",
      toggleMarkers: "Toggle Markers",
      pauseAnimations: "Pause Animations",
      clearAll: "Clear All",
      settings: "Settings",
      closeToolbar: "Close toolbar",

      // MCP status
      mcpConnected: "MCP server connected",
      mcpDisconnected: "MCP server disconnected",
      mcpConnecting: "Connecting to MCP server...",
      mcpConnectionFailed: "Cannot connect to MCP server",

      // Annotation modal
      groupAnnotation: "Group Annotation",
      elements: "elements",
      annotationPlaceholder: "Describe the issue or change you want...",
      groupAnnotationPlaceholder:
        "Describe the issue or change for these elements...",
      cancel: "Cancel",
      add: "Add",
      addGroupAnnotation: "Add Group Annotation",
      directSendToAI: "Send to AI",
      directSendPlaceholder: "Enter instructions for AI...",

      // Annotation detail
      annotation: "Annotation",
      delete: "Delete",
      edit: "Edit",
      save: "Save",
      close: "Close",
      deleteConfirmTitle: "Delete Annotation?",
      deleteConfirmMessage: "This action cannot be undone.",

      // Send to AI modal
      sendToAITitle: "Send to AI",
      annotationsToSend: "annotation(s) will be sent to AI.",
      additionalContextPlaceholder: "Enter additional context (optional)...",
      send: "Send",
      sending: "Sending...",
      copyInstead: "Copy to Clipboard",
      group: "Group",

      // Toast messages
      noAnnotations: "No annotations to copy",
      copiedAnnotations: "Copied {count} annotation(s) to clipboard",
      copyFailed: "Failed to copy",
      pleasAddFeedback: "Please add feedback first",
      sentToAI: "Feedback sent to AI",
      sendFailed: "Send failed: ",
      annotationUpdated: "Annotation updated",

      // Settings
      settingsTitle: "Settings",
      language: "Language",
      outputDetail: "Output Detail",
      standard: "Standard",
      detailed: "Detailed",
      markerColor: "Marker Color",
      blockInteractions: "Block page interactions",
      includePlaywrightHint: "Include Playwriter hint",
      playwrightHintPrompt:
        "[System] You can use Playwriter (NOT Playwright - it's a different tool) to verify the user's current browser session state. The page URL is provided above.",

      // Misc
      moreElements: "+{count} more elements",
      designTerms: "Design Terms",
      addDesignTerm: "Choose Design Style",
      designReferences: "Design References",

      // Annotation list modal
      noAnnotationsToManage: "No annotations to manage",
      annotations: "Annotations",
      clearAllAnnotations: "Clear All",
      allAnnotationsCleared: "All annotations cleared",
    },

    ko: {
      // Toolbar titles
      openAgentation: "Agentation 열기",
      toggleAgentation: "Agentation 토글",
      copyToClipboard: "클립보드에 복사",
      sendToAI: "AI에게 지시하기",
      toggleMarkers: "마커 토글",
      pauseAnimations: "애니메이션 일시정지",
      clearAll: "전체 삭제",
      settings: "설정",
      closeToolbar: "툴바 닫기",

      // MCP status
      mcpConnected: "MCP 서버 연결됨",
      mcpDisconnected: "MCP 서버 연결 안됨",
      mcpConnecting: "MCP 서버에 연결 중...",
      mcpConnectionFailed: "MCP 서버에 연결할 수 없습니다",

      // Annotation modal
      groupAnnotation: "그룹 어노테이션",
      elements: "개 요소",
      annotationPlaceholder: "문제점이나 변경사항을 설명해주세요...",
      groupAnnotationPlaceholder:
        "이 요소들에 대한 문제점이나 변경사항을 설명해주세요...",
      cancel: "취소",
      add: "추가",
      addGroupAnnotation: "그룹 어노테이션 추가",
      directSendToAI: "AI에게 전송",
      directSendPlaceholder: "AI에게 전달할 내용을 입력하세요...",

      // Annotation detail
      annotation: "어노테이션",
      delete: "삭제",
      edit: "편집",
      save: "저장",
      close: "닫기",
      deleteConfirmTitle: "어노테이션을 삭제할까요?",
      deleteConfirmMessage: "이 작업은 되돌릴 수 없습니다.",

      // Send to AI modal
      sendToAITitle: "AI에게 지시하기",
      annotationsToSend: "개의 어노테이션을 AI에게 전송합니다.",
      additionalContextPlaceholder: "추가 컨텍스트를 입력하세요 (선택사항)...",
      send: "AI에게 전송",
      sending: "전송 중...",
      copyInstead: "클립보드에 복사",
      group: "그룹",

      // Toast messages
      noAnnotations: "복사할 어노테이션이 없습니다",
      copiedAnnotations: "{count}개의 어노테이션을 클립보드에 복사했습니다",
      copyFailed: "복사 실패",
      pleasAddFeedback: "피드백을 추가해주세요",
      sentToAI: "AI에게 피드백을 전송했습니다",
      sendFailed: "전송 실패: ",
      annotationUpdated: "어노테이션이 업데이트되었습니다",

      // Settings
      settingsTitle: "설정",
      language: "언어",
      outputDetail: "출력 상세도",
      standard: "표준",
      detailed: "상세",
      markerColor: "마커 색상",
      blockInteractions: "페이지 상호작용 차단",
      includePlaywrightHint: "Playwriter 힌트 포함",
      playwrightHintPrompt:
        "[System] Playwriter(Playwright가 아닌 별도의 도구)를 사용하여 사용자의 현재 브라우저 세션 상태를 확인할 수 있습니다. 페이지 URL은 위에 제공되어 있습니다.",

      // Misc
      moreElements: "+{count}개 더",
      designTerms: "디자인 용어",
      addDesignTerm: "원하는 디자인 선택",
      designReferences: "디자인 참조",

      // Annotation list modal
      noAnnotationsToManage: "관리할 어노테이션이 없습니다",
      annotations: "어노테이션",
      clearAllAnnotations: "모두 삭제",
      allAnnotationsCleared: "모든 어노테이션이 삭제되었습니다",
    },
  };

  let currentLang = "en";

  function t(key, params = {}) {
    let text = translations[currentLang]?.[key] || translations.en[key] || key;
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  }

  function setLanguage(lang) {
    if (translations[lang]) {
      currentLang = lang;
    }
  }

  function getLanguage() {
    return currentLang;
  }

  function getAvailableLanguages() {
    return Object.keys(translations);
  }

  window.agentationI18n = {
    t,
    setLanguage,
    getLanguage,
    getAvailableLanguages,
  };
})();
