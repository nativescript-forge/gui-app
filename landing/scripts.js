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
});
