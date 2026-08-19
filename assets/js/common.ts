/**
 * Shared setup used by both the index page and the uploaded image page.
 */
(() => {
  const $window = $(window);
  const $body = $("body");
  let $canvas: JQuery | null = null;

  // Global console.log shorthand
  window.log = function (...args: any[]) {
    if (window.console) {
      window.console.log.apply(window.console, args);
    }
  };

  // Draws a canvas overlay for the vignette effect
  // TODO: Use a CSS gradient instead?
  function drawBackgroundOverlay(): void {
    $canvas = $canvas || $(".shadow");
    if (!$canvas[0] || !($canvas[0] as HTMLCanvasElement).getContext) return;

    const ctx = ($canvas[0] as HTMLCanvasElement).getContext("2d")!;

    $canvas.css({
      width: Math.max($body.outerWidth(), $window.width()),
      height: Math.max($body.outerHeight(), $window.height()),
    });
    ctx.clearRect(0, 0, $window.width(), $window.height());

    const gradient = ctx.createRadialGradient(150, 50, 0, 150, 50, 200);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.3, "rgba(0,0,0,0.1)");
    gradient.addColorStop(0.6, "rgba(0,0,0,0.25)");
    gradient.addColorStop(1, "rgba(0,0,0,0.6)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, $window.width(), $window.height());
  }

  window.drawBackgroundOverlay = drawBackgroundOverlay;

  $(() => {
    // Used to prevent transition "flashing" on load with -prefix-free
    $("body").addClass("loaded");

    drawBackgroundOverlay();
    $window.resize(drawBackgroundOverlay);
  });
})();