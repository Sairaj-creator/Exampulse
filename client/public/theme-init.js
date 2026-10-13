// Applies the saved theme and motion preference before first paint, so the
// page never flashes the wrong palette. Kept as a file (not inline) so it
// passes the production Content-Security-Policy.
(function () {
  var root = document.documentElement;
  var theme = null;
  var motion = null;
  try {
    theme = localStorage.getItem("ep-theme");
    motion = localStorage.getItem("ep-motion");
  } catch {
    // Storage can be blocked; fall through to system preferences.
  }
  var prefers = function (query) {
    return (
      typeof window.matchMedia === "function" && window.matchMedia(query).matches
    );
  };
  if (theme !== "light" && theme !== "dark") {
    theme = prefers("(prefers-color-scheme: dark)") ? "dark" : "light";
  }
  if (motion !== "on" && motion !== "off") {
    motion = prefers("(prefers-reduced-motion: reduce)") ? "off" : "on";
  }
  root.dataset.theme = theme;
  root.dataset.motion = motion;
})();
