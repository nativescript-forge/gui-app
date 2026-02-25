// Data for AlpineJS
function featureData() {
  return {
    features: [
      {
        id: 1,
        title: "Setup & Environment",
        icon: "fas fa-microchip",
        delay: "",
        items: [
          "Automatic OS Detection",
          "Integrated SDK Management",
          "NativeScript Doctor Checks",
          "AVD / Emulator Controls",
        ],
      },
      {
        id: 2,
        title: "Project Management",
        icon: "fas fa-project-diagram",
        delay: "delay-1",
        items: [
          "Multi-flavor Project Creation",
          "Batch Project Discovery",
          "VisionOS Platform Support",
          "Recent Projects with History",
        ],
      },
      {
        id: 3,
        title: "App Mode Dashboard",
        icon: "fas fa-rocket",
        delay: "delay-2",
        items: [
          "Real-time Package Audits",
          "One-click Run & Debug",
          "Production Build Pipeline",
          "Device Management & Selection",
        ],
      },
      {
        id: 4,
        title: "Visual Configuration",
        icon: "fas fa-sliders-h",
        delay: "",
        items: [
          "Visual `nativescript.config.ts`",
          "Android Manifest Permissions",
          "iOS Info.plist Permissions",
          "Platform Specific Configs",
        ],
      },
      {
        id: 5,
        title: "Assets & Plugins",
        icon: "fas fa-puzzle-piece",
        delay: "delay-1",
        items: [
          "Icon & Splash Generation",
          "Plugin Marketplace Search",
          "NPM Search & Bulk Updates",
          "Real-time Install Status",
        ],
      },
      {
        id: 6,
        title: "Persistence & Logs",
        icon: "fas fa-database",
        delay: "delay-2",
        items: [
          "SQLite Database Storage",
          "Categorized Global Logs",
          "Searchable Build History",
          "System Report & Doctor",
        ],
      },
      {
        id: 7,
        title: "Device & OS",
        icon: "fas fa-mobile-alt",
        delay: "",
        items: [
          "Multi-OS Support (Win/Mac/Linux)",
          "Emulator & Physical Devices",
          "Custom Titlebar Controls",
          "Context-aware UI Layout",
        ],
      },
      {
        id: 8,
        title: "Native Resources",
        icon: "fas fa-code-branch",
        delay: "delay-1",
        items: [
          "Android Gradle Editor",
          "iOS xcconfig Management",
          "Manifest & Plist Visualizer",
          "Advanced Runtime Flags",
        ],
      },
      {
        id: 9,
        title: "Cloud Build",
        icon: "fas fa-cloud-upload-alt",
        delay: "delay-2",
        isComingSoon: true,
        items: [
          "Build Cloud by Norrix.net",
          "Remote CI/CD Pipeline",
          "Over-the-air Updates",
          "Cloud-based Signing",
        ],
      },
    ],
  };
}

function showcaseData() {
  return {
    tabs: [
      {
        id: "setup",
        title: "Setup & Prep",
        subtitle: "Environment Configuration",
        num: 1,
        active: true,
        folder: "1-setup",
        images: [
          { file: "1-preparation.png", title: "Preparation" },
          { file: "2-setup.png", title: "Setup" },
          { file: "3-setup-nodejs.png", title: "Setup Node.js" },
          { file: "4-setup-jdk.png", title: "Setup JDK" },
          { file: "5-setup-android-sdk.png", title: "Setup Android SDK" },
          { file: "6-setup-env.png", title: "Setup Environment" },
          { file: "7-setup-done.png", title: "Setup Done" },
        ],
      },
      {
        id: "welcome",
        title: "Welcome Home",
        subtitle: "Dashboard & Project Library",
        num: 2,
        active: false,
        folder: "2-welcome",
        images: [
          { file: "1-home.png", title: "Home" },
          { file: "2-create-app.png", title: "Create App" },
          { file: "3-project-library.png", title: "Project Library" },
          { file: "4-activity-log.png", title: "Activity Log" },
          { file: "5-settings.png", title: "Settings" },
        ],
      },
      {
        id: "app",
        title: "App Management",
        subtitle: "Build, Run & Configure",
        num: 3,
        active: false,
        folder: "3-app",
        images: [
          { file: "1-app-properties.png", title: "App Properties" },
          { file: "2-app-dashboard.png", title: "App Dashboard" },
          { file: "3-app-env-checker.png", title: "App Env Checker" },
          { file: "4-app-run-app-wizard.png", title: "App Run App Wizard" },
          { file: "5-app-build-app-wizard.png", title: "App Build App Wizard" },
          { file: "6-app-resource-config.png", title: "App Resource Config" },
          { file: "7-app-font-config.png", title: "App Font Config" },
          { file: "8-app-project-config.png", title: "App Project Config" },
          { file: "9-app-platform-config.png", title: "App Platform Config" },
          { file: "10-app-install-plugin.png", title: "App Install Plugin" },
          {
            file: "11-app-manage-permission.png",
            title: "App Manage Permission",
          },
        ],
      },
    ],
  };
}

function flavorData() {
  return {
    flavors: [
      { name: "Angular", icon: "assets/images/flavors/angular.svg" },
      { name: "React", icon: "assets/images/flavors/reactjs.svg" },
      { name: "Vue", icon: "assets/images/flavors/vue.svg" },
      { name: "Svelte", icon: "assets/images/flavors/svelte.svg" },
      { name: "Solid", icon: "assets/images/flavors/solid.svg" },
      { name: "Core (TS)", icon: "assets/images/flavors/typescript.svg" },
      { name: "Core (JS)", icon: "assets/images/flavors/javascript.svg" },
    ],
  };
}

function downloadData() {
  return {
    platforms: [
      {
        id: "windows",
        name: "Windows",
        icon: "fab fa-windows",
        desc: "Installer for Windows 10/11 (x64)",
        delay: "",
      },
      {
        id: "macos",
        name: "macOS",
        icon: "fab fa-apple",
        desc: "Apple Silicon & Intel (DMG)",
        delay: "delay-1",
      },
      {
        id: "linux",
        name: "Linux",
        icon: "fab fa-linux",
        desc: "AppImage & Deb for Linux distros",
        delay: "delay-2",
      },
    ],
  };
}

$(document).ready(function () {
  // Theme Toggle Logic
  const themeToggle = $("#theme-toggle");
  const body = $("body");
  const darkIcon = $(".theme-icon-dark");
  const lightIcon = $(".theme-icon-light");

  // Check for saved theme or system preference
  const savedTheme = localStorage.getItem("ns-forge-theme") || "dark";
  setTheme(savedTheme);

  themeToggle.on("click", function () {
    const currentTheme = body.attr("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });

  function setTheme(theme) {
    body.attr("data-theme", theme);
    localStorage.setItem("ns-forge-theme", theme);

    if (theme === "light") {
      darkIcon.addClass("d-none");
      lightIcon.removeClass("d-none");
    } else {
      lightIcon.addClass("d-none");
      darkIcon.removeClass("d-none");
    }
  }

  // Navbar scroll effect
  $(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
      $(".glass-nav").addClass("scrolled");
    } else {
      $(".glass-nav").removeClass("scrolled");
    }
  });

  // Smooth scrolling for anchor links
  $("a.nav-link, a.btn").on("click", function (event) {
    if (this.hash !== "" && this.hash.startsWith("#")) {
      event.preventDefault();
      var hash = this.hash;

      if ($(hash).length) {
        $("html, body").animate(
          {
            scrollTop: $(hash).offset().top - 100,
          },
          800,
          "swing",
        );
      }
    }
  });

  // Intersection Observer for advanced scroll reveal
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        $(entry.target).addClass("visible");
        // Optional: stop observing once revealed
        // revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with fade-in-up class
  $(".fade-in-up").each(function () {
    revealObserver.observe(this);
  });

  // SwiperJS Initialization with a small delay to ensure AlpineJS has rendered the slides
  setTimeout(() => {
    const swiperOptions = {
      loop: true,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      grabCursor: true,
      effect: "creative",
      creativeEffect: {
        prev: {
          shadow: true,
          translate: [0, 0, -400],
        },
        next: {
          translate: ["100%", 0, 0],
        },
      },
    };

    const swiperSetup = new Swiper(".swiper-setup", swiperOptions);
    const swiperWelcome = new Swiper(".swiper-welcome", swiperOptions);
    const swiperApp = new Swiper(".swiper-app", swiperOptions);

    // Fix Swiper update on tab change
    $('button[data-bs-toggle="pill"]').on("shown.bs.tab", function (e) {
      if (swiperSetup) swiperSetup.update();
      if (swiperWelcome) swiperWelcome.update();
      if (swiperApp) swiperApp.update();
    });
  }, 100);
});
