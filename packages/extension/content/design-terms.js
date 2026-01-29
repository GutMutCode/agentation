window.agentationDesignTerms = {
  categories: [
    { id: "layout", name: "Layout", nameKo: "레이아웃" },
    { id: "interaction", name: "Interaction", nameKo: "인터랙션" },
    { id: "feedback", name: "Feedback", nameKo: "피드백" },
    { id: "visual", name: "Visual", nameKo: "비주얼" },
    { id: "animation", name: "Animation", nameKo: "애니메이션" },
    { id: "concept", name: "Concept", nameKo: "컨셉" },
  ],

  terms: [
    {
      id: "gnb",
      term: "GNB",
      subtitle: "Global Navigation Bar",
      icon: "🧭",
      category: "layout",
      description: "Fixed menu bar always visible at the top of the site",
      descriptionKo: "사이트 최상단에 항상 고정된 메뉴 바",
      prompt: "GNB (Global Navigation Bar) - 최상단 고정 네비게이션",
      previewHtml: `
        <div class="adt-gnb-demo">
          <div class="adt-gnb-bar">
            <span class="adt-gnb-logo">Logo</span>
            <div class="adt-gnb-links">
              <span>Home</span>
              <span>About</span>
              <span>Contact</span>
            </div>
          </div>
          <div class="adt-gnb-content">
            <div class="adt-placeholder-line"></div>
            <div class="adt-placeholder-line short"></div>
          </div>
        </div>
      `,
    },
    {
      id: "sticky-header",
      term: "Sticky Header",
      subtitle: "Fixed Header on Scroll",
      icon: "📌",
      category: "layout",
      description: "Header that stays fixed at the top while scrolling",
      descriptionKo: "스크롤해도 상단에 고정되어 따라오는 헤더",
      prompt: "Sticky Header - 스크롤 시 상단 고정 헤더",
      previewHtml: `
        <div class="adt-sticky-demo">
          <div class="adt-sticky-header">↓ Scroll me - Header stays!</div>
          <div class="adt-sticky-scroll-area">
            <div class="adt-placeholder-line"></div>
            <div class="adt-placeholder-line short"></div>
            <div class="adt-placeholder-line"></div>
            <div class="adt-placeholder-line short"></div>
            <div class="adt-placeholder-line"></div>
            <div class="adt-placeholder-line short"></div>
            <div class="adt-placeholder-line"></div>
            <div class="adt-placeholder-line short"></div>
          </div>
        </div>
      `,
    },
    {
      id: "hero-section",
      term: "Hero Section",
      subtitle: "Main Visual Area",
      icon: "🦸",
      category: "layout",
      description: "The first prominent area visible when entering a webpage",
      descriptionKo: "웹페이지 접속 시 가장 먼저 보이는 상단 영역",
      prompt: "Hero Section - 페이지 최상단 주요 영역",
      previewHtml: `
        <div class="adt-hero-demo">
          <div class="adt-hero-bg"></div>
          <div class="adt-hero-content">
            <div class="adt-hero-title">Welcome</div>
            <div class="adt-hero-subtitle">Your journey starts here</div>
            <button class="adt-hero-cta">Get Started</button>
          </div>
        </div>
      `,
    },
    {
      id: "breadcrumbs",
      term: "Breadcrumbs",
      subtitle: "Navigation Path",
      icon: "🥖",
      category: "layout",
      description: "Path indicator showing current location in site hierarchy",
      descriptionKo: "현재 위치를 보여주는 경로 표시",
      prompt: "Breadcrumbs - 경로 탐색 네비게이션",
      previewHtml: `
        <div class="adt-breadcrumbs-demo">
          <span class="adt-crumb">Home</span>
          <span class="adt-crumb-sep">›</span>
          <span class="adt-crumb">Products</span>
          <span class="adt-crumb-sep">›</span>
          <span class="adt-crumb current">Item</span>
        </div>
      `,
    },
    {
      id: "footer",
      term: "Footer",
      subtitle: "Page Bottom Section",
      icon: "🦶",
      category: "layout",
      description: "Bottom area of the website containing links and info",
      descriptionKo: "사이트 맨 아래 영역",
      prompt: "Footer - 페이지 하단 영역",
      previewHtml: `
        <div class="adt-footer-demo">
          <div class="adt-footer-content"></div>
          <div class="adt-footer-bar">
            <span>© 2024 Company</span>
            <div class="adt-footer-links">
              <span>Privacy</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
      `,
    },
    {
      id: "bento-grid",
      term: "Bento Grid",
      subtitle: "Box Layout Grid",
      icon: "🍱",
      category: "layout",
      description: "Layout arranged in rectangular boxes like a bento box",
      descriptionKo: "도시락 통처럼 직사각형 칸들로 배치하는 레이아웃",
      prompt: "Bento Grid - 도시락 스타일 그리드 레이아웃",
      previewHtml: `
        <div class="adt-bento-demo">
          <div class="adt-bento-item large"></div>
          <div class="adt-bento-item"></div>
          <div class="adt-bento-item"></div>
          <div class="adt-bento-item wide"></div>
        </div>
      `,
    },
    {
      id: "drawer-menu",
      term: "Drawer Menu",
      subtitle: "Slide-out Panel",
      icon: "🗄️",
      category: "layout",
      description: "Menu panel that slides in from the side of the screen",
      descriptionKo: "화면 옆에서 슬라이드되어 나오는 메뉴 패널",
      prompt: "Drawer Menu - 슬라이드 사이드 메뉴",
      previewHtml: `
        <div class="adt-drawer-demo">
          <div class="adt-drawer-panel">
            <div class="adt-drawer-item"></div>
            <div class="adt-drawer-item short"></div>
            <div class="adt-drawer-item"></div>
          </div>
          <div class="adt-drawer-main">
            <div class="adt-drawer-trigger">☰</div>
          </div>
        </div>
      `,
    },
    {
      id: "bottom-sheet",
      term: "Bottom Sheet",
      subtitle: "Bottom Panel",
      icon: "📄",
      category: "layout",
      description: "Panel that slides up from the bottom of the screen",
      descriptionKo: "화면 아래에서 올라오는 패널",
      prompt: "Bottom Sheet - 하단에서 올라오는 모달 패널",
      previewHtml: `
        <div class="adt-bottomsheet-demo">
          <div class="adt-bottomsheet-content">
            <div class="adt-placeholder-line short"></div>
          </div>
          <div class="adt-bottomsheet-panel">
            <div class="adt-bottomsheet-handle"></div>
            <div class="adt-placeholder-line"></div>
            <div class="adt-placeholder-line short"></div>
          </div>
        </div>
      `,
    },
    {
      id: "cta-button",
      term: "CTA Button",
      subtitle: "Call-to-Action Button",
      icon: "👆",
      category: "interaction",
      description: "Primary button prompting users to take a specific action",
      descriptionKo: "사용자에게 명확한 행동을 요청하는 주요 버튼",
      prompt: "CTA Button - 눈에 띄는 행동 유도 버튼",
      previewHtml: `
        <div class="adt-cta-demo">
          <button class="adt-cta-btn">Get Started</button>
        </div>
      `,
    },
    {
      id: "toggle",
      term: "Toggle",
      subtitle: "On/Off Switch",
      icon: "🌗",
      category: "interaction",
      description: "Switch that instantly changes between on and off states",
      descriptionKo: "켜짐/꺼짐 두 가지 상태를 즉시 변경",
      prompt: "Toggle Switch - ON/OFF 토글 스위치",
      previewHtml: `
        <div class="adt-toggle-demo">
          <div class="adt-toggle-track">
            <div class="adt-toggle-thumb"></div>
          </div>
        </div>
      `,
    },
    {
      id: "accordion",
      term: "Accordion",
      subtitle: "Expandable Panel",
      icon: "🎹",
      category: "interaction",
      description: "UI that expands content when the header is clicked",
      descriptionKo: "제목을 누르면 내용이 펼쳐지는 UI",
      prompt: "Accordion - 접었다 펼 수 있는 콘텐츠 패널",
      previewHtml: `
        <div class="adt-accordion-demo">
          <div class="adt-accordion-item open">
            <div class="adt-accordion-header">Section 1 <span>▼</span></div>
            <div class="adt-accordion-body">Hidden content revealed!</div>
          </div>
          <div class="adt-accordion-item">
            <div class="adt-accordion-header">Section 2 <span>▶</span></div>
          </div>
        </div>
      `,
    },
    {
      id: "chip",
      term: "Chip",
      subtitle: "Tag Button",
      icon: "💊",
      category: "interaction",
      description: "Small button representing a tag or filter option",
      descriptionKo: "태그나 필터를 나타내는 작은 버튼",
      prompt: "Chip - 선택/필터용 태그 버튼",
      previewHtml: `
        <div class="adt-chip-demo">
          <span class="adt-chip active">UX</span>
          <span class="adt-chip">UI</span>
          <span class="adt-chip">Web</span>
        </div>
      `,
    },
    {
      id: "tooltip",
      term: "Tooltip",
      subtitle: "Hover Hint",
      icon: "💬",
      category: "interaction",
      description: "Help text that appears when hovering over an element",
      descriptionKo: "요소에 마우스를 올렸을 때 나타나는 도움말",
      prompt: "Tooltip - 호버 시 나타나는 도움말 팝업",
      previewHtml: `
        <div class="adt-tooltip-demo">
          <div class="adt-tooltip-trigger">?
            <div class="adt-tooltip-box">Extra info appears here!</div>
          </div>
        </div>
      `,
    },
    {
      id: "carousel",
      term: "Carousel",
      subtitle: "Sliding Content",
      icon: "🎠",
      category: "interaction",
      description: "UI that displays content by sliding left and right",
      descriptionKo: "콘텐츠를 좌우로 슬라이드하며 보여주는 UI",
      prompt: "Carousel - 좌우 슬라이드 콘텐츠 뷰어",
      previewHtml: `
        <div class="adt-carousel-demo">
          <div class="adt-carousel-track">
            <div class="adt-carousel-slide s1">1</div>
            <div class="adt-carousel-slide s2">2</div>
            <div class="adt-carousel-slide s3">3</div>
          </div>
          <div class="adt-carousel-dots">
            <span class="active"></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `,
    },
    {
      id: "magnetic-button",
      term: "Magnetic Button",
      subtitle: "Cursor-following Button",
      icon: "🧲",
      category: "interaction",
      description: "Button effect that follows the cursor when nearby",
      descriptionKo: "마우스가 가까이 가면 따라오는 버튼 효과",
      prompt: "Magnetic Button - 마우스를 따라오는 인터랙티브 버튼",
      previewHtml: `
        <div class="adt-magnetic-demo">
          <button class="adt-magnetic-btn">Hover me</button>
          <div class="adt-magnetic-hint">↖ ↗ Button follows cursor</div>
        </div>
      `,
    },
    {
      id: "skeleton-screen",
      term: "Skeleton Screen",
      subtitle: "Loading Placeholder",
      icon: "💀",
      category: "feedback",
      description: "Placeholder framework shown while content is loading",
      descriptionKo: "로딩 중에 보여주는 뼈대 화면",
      prompt: "Skeleton Screen - 로딩 플레이스홀더 UI",
      previewHtml: `
        <div class="adt-skeleton-demo">
          <div class="adt-skeleton-avatar"></div>
          <div class="adt-skeleton-lines">
            <div class="adt-skeleton-line"></div>
            <div class="adt-skeleton-line short"></div>
          </div>
        </div>
      `,
    },
    {
      id: "toast",
      term: "Toast",
      subtitle: "Temporary Notification",
      icon: "🍞",
      category: "feedback",
      description:
        "Brief notification that appears and disappears automatically",
      descriptionKo: "잠깐 나타났다 사라지는 알림",
      prompt: "Toast/Snackbar - 임시 알림 메시지",
      previewHtml: `
        <div class="adt-toast-demo">
          <div class="adt-toast-popup">
            <span class="adt-toast-icon">✓</span>
            Saved successfully!
          </div>
        </div>
      `,
    },
    {
      id: "badge",
      term: "Badge",
      subtitle: "Notification Indicator",
      icon: "🔴",
      category: "feedback",
      description: "Small dot or number attached to an icon",
      descriptionKo: "아이콘 위에 붙는 작은 점이나 숫자",
      prompt: "Badge - 알림 표시 배지",
      previewHtml: `
        <div class="adt-badge-demo">
          <div class="adt-badge-icon">
            🔔
            <span class="adt-badge-dot">3</span>
          </div>
        </div>
      `,
    },
    {
      id: "empty-state",
      term: "Empty State",
      subtitle: "No Data View",
      icon: "📭",
      category: "feedback",
      description: "Screen shown when there is no data to display",
      descriptionKo: "데이터가 없을 때 보여주는 화면",
      prompt: "Empty State - 데이터 없음 상태 화면",
      previewHtml: `
        <div class="adt-empty-demo">
          <div class="adt-empty-icon">📂</div>
          <div class="adt-empty-text">No items yet</div>
          <button class="adt-empty-btn">+ Add New</button>
        </div>
      `,
    },
    {
      id: "micro-interaction",
      term: "Micro-interaction",
      subtitle: "Subtle Animation Feedback",
      icon: "❤️",
      category: "feedback",
      description: "Small animation response to user actions",
      descriptionKo: "사용자 행동에 대한 미세한 애니메이션 반응",
      prompt: "Micro-interaction - 세밀한 인터랙티브 피드백",
      previewHtml: `
        <div class="adt-micro-demo">
          <button class="adt-heart-btn">♥</button>
          <span class="adt-micro-hint">Click to like!</span>
        </div>
      `,
    },
    {
      id: "progressive-disclosure",
      term: "Progressive Disclosure",
      subtitle: "Gradual Information Reveal",
      icon: "✨",
      category: "feedback",
      description: "Technique of showing information in stages",
      descriptionKo: "정보를 단계적으로 보여주는 기법",
      prompt: "Progressive Disclosure - 단계적 정보 공개 패턴",
      previewHtml: `
        <div class="adt-progressive-demo">
          <div class="adt-prog-basic">☑ Basic Option</div>
          <div class="adt-prog-toggle">Show more ▼</div>
          <div class="adt-prog-advanced">
            <div>☐ Advanced 1</div>
            <div>☐ Advanced 2</div>
          </div>
        </div>
      `,
    },
    {
      id: "glassmorphism",
      term: "Glassmorphism",
      subtitle: "Frosted Glass Effect",
      icon: "🪟",
      category: "visual",
      description: "Semi-transparent frosted glass-like visual effect",
      descriptionKo: "반투명 유리처럼 보이는 효과",
      prompt: "Glassmorphism - 반투명 유리 효과 (blur + transparency)",
      previewHtml: `
        <div class="adt-glass-demo">
          <div class="adt-glass-bg"></div>
          <div class="adt-glass-card">Frosted Glass</div>
        </div>
      `,
    },
    {
      id: "gradient-border",
      term: "Gradient Border",
      subtitle: "Colorful Edge",
      icon: "🌈",
      category: "visual",
      description: "Border with gradient color transition",
      descriptionKo: "그라디언트 색상의 테두리",
      prompt: "Gradient Border - 그라디언트 테두리 효과",
      previewHtml: `
        <div class="adt-gradient-border-demo">
          <div class="adt-gradient-card">Gradient Border</div>
        </div>
      `,
    },
    {
      id: "neon-pulse",
      term: "Neon Pulse",
      subtitle: "Glowing Effect",
      icon: "💡",
      category: "visual",
      description: "Glowing effect like neon lights",
      descriptionKo: "네온 조명처럼 빛나는 효과",
      prompt: "Neon Pulse - 네온 발광 효과",
      previewHtml: `
        <div class="adt-neon-demo">
          <div class="adt-neon-circle"></div>
        </div>
      `,
    },
    {
      id: "dark-mode",
      term: "Dark Mode",
      subtitle: "Dark Theme",
      icon: "🌙",
      category: "visual",
      description: "UI theme with dark background colors",
      descriptionKo: "어두운 배경의 UI 테마",
      prompt: "Dark Mode - 다크 테마 색상 체계",
      previewHtml: `
        <div class="adt-darkmode-demo">
          <div class="adt-dm-light">☀️</div>
          <div class="adt-dm-dark">🌙</div>
        </div>
      `,
    },
    {
      id: "design-token",
      term: "Design Token",
      subtitle: "Design Variables",
      icon: "🎨",
      category: "visual",
      description:
        "Managing design values like colors and spacing as variables",
      descriptionKo: "색상, 간격 등 디자인 값을 변수로 관리",
      prompt: "Design Token - CSS 변수 기반 디자인 시스템",
      previewHtml: `
        <div class="adt-token-demo">
          <div class="adt-token-row">
            <span class="adt-token-swatch primary"></span>
            <span>--primary</span>
          </div>
          <div class="adt-token-row">
            <span class="adt-token-swatch accent"></span>
            <span>--accent</span>
          </div>
          <div class="adt-token-row">
            <span class="adt-token-swatch success"></span>
            <span>--success</span>
          </div>
        </div>
      `,
    },
    {
      id: "z-index",
      term: "Z-index",
      subtitle: "Layer Order",
      icon: "📚",
      category: "visual",
      description: "Determining the front-to-back order of elements",
      descriptionKo: "요소의 앞뒤 순서(레이어) 결정",
      prompt: "Z-index - 레이어 순서 관리",
      previewHtml: `
        <div class="adt-zindex-demo">
          <div class="adt-z-card z1">1</div>
          <div class="adt-z-card z2">2</div>
          <div class="adt-z-card z3">3</div>
        </div>
      `,
    },
    {
      id: "fluid-typography",
      term: "Fluid Typography",
      subtitle: "Responsive Font Size",
      icon: "📝",
      category: "visual",
      description: "Font size that scales smoothly with screen size",
      descriptionKo: "화면 크기에 따라 자연스럽게 변하는 글자 크기",
      prompt: "Fluid Typography - 반응형 폰트 크기 (clamp/vw)",
      previewHtml: `
        <div class="adt-fluid-demo">
          <div class="adt-fluid-box">
            <span class="adt-fluid-text">Resize</span>
          </div>
        </div>
      `,
    },
    {
      id: "isometric-design",
      term: "Isometric Design",
      subtitle: "3D Angled Illustration",
      icon: "📐",
      category: "visual",
      description: "3D-looking illustration at 45-degree angles",
      descriptionKo: "45도 각도의 3D 느낌 일러스트",
      prompt: "Isometric Design - 45도 각도 3D 스타일 일러스트",
      previewHtml: `
        <div class="adt-iso-demo">
          <div class="adt-iso-cube"></div>
        </div>
      `,
    },
    {
      id: "parallax",
      term: "Parallax",
      subtitle: "Depth Scrolling",
      icon: "🏔️",
      category: "animation",
      description:
        "Effect where elements move at different speeds while scrolling",
      descriptionKo: "스크롤 시 요소들이 다른 속도로 움직이는 효과",
      prompt: "Parallax - 스크롤 기반 다중 레이어 움직임",
      previewHtml: `
        <div class="adt-parallax-demo">
          <div class="adt-parallax-sun"></div>
          <div class="adt-parallax-cloud"></div>
          <div class="adt-parallax-layer bg"></div>
          <div class="adt-parallax-layer mid"></div>
          <div class="adt-parallax-layer fg"></div>
        </div>
      `,
    },
    {
      id: "kinetic-typography",
      term: "Kinetic Typography",
      subtitle: "Animated Text",
      icon: "🔤",
      category: "animation",
      description: "Typography with motion and animation",
      descriptionKo: "글자가 움직이는 모션 타이포그래피",
      prompt: "Kinetic Typography - 움직이는 텍스트 애니메이션",
      previewHtml: `
        <div class="adt-kinetic-demo">
          <span class="adt-kinetic-text">MOTION</span>
        </div>
      `,
    },
    {
      id: "morphing",
      term: "Morphing",
      subtitle: "Shape Transformation",
      icon: "🔄",
      category: "animation",
      description: "Effect of smoothly transforming from one shape to another",
      descriptionKo: "한 형태에서 다른 형태로 자연스럽게 변하는 효과",
      prompt: "Morphing - 형태 변환 애니메이션",
      previewHtml: `
        <div class="adt-morph-demo">
          <div class="adt-morph-shape"></div>
        </div>
      `,
    },
    {
      id: "3d-tilt-effect",
      term: "3D Tilt Effect",
      subtitle: "Perspective Tilt",
      icon: "🎴",
      category: "animation",
      description: "3D tilting effect based on cursor movement",
      descriptionKo: "마우스 움직임에 따라 기울어지는 3D 효과",
      prompt: "3D Tilt Effect - 마우스 추적 3D 기울기 효과",
      previewHtml: `
        <div class="adt-tilt-demo">
          <div class="adt-tilt-card">3D Tilt</div>
        </div>
      `,
    },
    {
      id: "spring-animation",
      term: "Spring Animation",
      subtitle: "Bouncy Motion",
      icon: "🌀",
      category: "animation",
      description: "Animation with spring-like elastic movement",
      descriptionKo: "스프링처럼 탄성 있게 움직이는 애니메이션",
      prompt: "Spring Animation - 탄성 기반 자연스러운 모션",
      previewHtml: `
        <div class="adt-spring-demo">
          <div class="adt-spring-box">Bounce!</div>
        </div>
      `,
    },
    {
      id: "stagger-animation",
      term: "Stagger Animation",
      subtitle: "Sequential Reveal",
      icon: "🎯",
      category: "animation",
      description: "Animation where multiple elements appear sequentially",
      descriptionKo: "여러 요소가 순차적으로 나타나는 애니메이션",
      prompt: "Stagger Animation - 순차적 등장 애니메이션",
      previewHtml: `
        <div class="adt-stagger-demo">
          <div class="adt-stagger-bar"></div>
          <div class="adt-stagger-bar"></div>
          <div class="adt-stagger-bar"></div>
          <div class="adt-stagger-bar"></div>
          <div class="adt-stagger-bar"></div>
        </div>
      `,
    },
    {
      id: "easing",
      term: "Easing",
      subtitle: "Animation Timing",
      icon: "📈",
      category: "animation",
      description: "Speed curve that controls animation acceleration",
      descriptionKo: "애니메이션의 속도 곡선",
      prompt: "Easing Function - ease-in-out, cubic-bezier 등 속도 곡선",
      previewHtml: `
        <div class="adt-easing-demo">
          <div class="adt-easing-row">
            <span>linear</span>
            <div class="adt-easing-track"><div class="adt-easing-ball linear"></div></div>
          </div>
          <div class="adt-easing-row">
            <span>ease</span>
            <div class="adt-easing-track"><div class="adt-easing-ball ease"></div></div>
          </div>
          <div class="adt-easing-row">
            <span>bounce</span>
            <div class="adt-easing-track"><div class="adt-easing-ball bounce"></div></div>
          </div>
        </div>
      `,
    },
    {
      id: "wireframe",
      term: "Wireframe",
      subtitle: "Structural Sketch",
      icon: "📋",
      category: "concept",
      description: "Basic structural blueprint using lines and boxes",
      descriptionKo: "선과 상자로만 구성한 뼈대 설계도",
      prompt: "Wireframe - 기본 구조 스케치",
      previewHtml: `
        <div class="adt-wireframe-demo">
          <div class="adt-wf-block header"></div>
          <div class="adt-wf-block image"></div>
          <div class="adt-wf-block text"></div>
          <div class="adt-wf-block text short"></div>
        </div>
      `,
    },
    {
      id: "mockup",
      term: "Mockup",
      subtitle: "Static Design",
      icon: "🖼️",
      category: "concept",
      description: "Static design with colors, fonts, and images applied",
      descriptionKo: "색상, 폰트, 이미지를 입힌 정적인 디자인 완성본",
      prompt: "Mockup - 정적 디자인 시안",
      previewHtml: `
        <div class="adt-mockup-demo">
          <div class="adt-mu-block header"></div>
          <div class="adt-mu-block image"></div>
          <div class="adt-mu-block text"></div>
          <div class="adt-mu-block text short"></div>
        </div>
      `,
    },
    {
      id: "prototype",
      term: "Prototype",
      subtitle: "Interactive Demo",
      icon: "🔗",
      category: "concept",
      description: "Simulation where you can click through actual interactions",
      descriptionKo: "실제 동작을 클릭해볼 수 있는 시뮬레이션",
      prompt: "Prototype - 인터랙티브 동작 시뮬레이션",
      previewHtml: `
        <div class="adt-prototype-demo">
          <button class="adt-proto-btn">Click Me!</button>
          <div class="adt-proto-feedback">✓ Action!</div>
        </div>
      `,
    },
    {
      id: "inclusive-design",
      term: "Inclusive Design",
      subtitle: "Accessible Design",
      icon: "♿",
      category: "concept",
      description: "Design accessible to all users with accessibility in mind",
      descriptionKo: "모든 사용자를 위한 접근성 있는 디자인",
      prompt: "Inclusive Design - 접근성 고려 디자인 (a11y)",
      previewHtml: `
        <div class="adt-inclusive-demo">
          <div class="adt-contrast-box bad">Low Contrast</div>
          <div class="adt-contrast-box good">High Contrast</div>
        </div>
      `,
    },
  ],

  getByCategory(categoryId) {
    return this.terms.filter((t) => t.category === categoryId);
  },

  getById(id) {
    return this.terms.find((t) => t.id === id);
  },

  search(query) {
    const q = query.toLowerCase();
    return this.terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.description.includes(q) ||
        (t.descriptionKo && t.descriptionKo.includes(q)),
    );
  },
};
