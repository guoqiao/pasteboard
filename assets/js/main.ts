/**
 * Index page entry point.
 */
(() => {
  const pasteboard: Pasteboard = {};
  window.moduleLoader.loadAll(pasteboard);

// Load the "about" text and display the modal when clicking the button
const loadAbout = () => {
  pasteboard.template.compile("jstemplates/about.tmpl", {}, (compiledTemplate: string) => {
    $(document).on("click", ".show-about", (e) => {
      e.preventDefault();
      pasteboard.modalWindow.show(
        "text",
        {
          content: compiledTemplate,
          showClose: true,
        },
        (modal: JQuery) => {}
      );
    });
  });
};

// Load the recent uploads template and display the modal
// when clicking the button, unless there are no recent uploads
const loadUploads = () => {
  if (!window.RECENT_UPLOADS.length) return;

  pasteboard.template.compile(
    "jstemplates/uploads.tmpl",
    { images: window.RECENT_UPLOADS },
    (compiledTemplate: string) => {
      $(".show-uploads").addClass("show");
      $(document).on("click", ".show-uploads", (e) => {
        e.preventDefault();
        pasteboard.modalWindow.show("uploads", {
          content: compiledTemplate,
          showClose: true,
        });
      });
    }
  );
};

// Display welcome message (to users redirected from pasteshack.net)
const displayRedirectWelcome = () => {
  if ($(".welcome").length > 0) {
    $(".welcome")
      .css("display", "block")
      .delay(1500)
      .transition({
        top: 0,
        opacity: 1,
      });
  }
};

$(() => {
  pasteboard.appFlow.start();

  loadAbout();
  loadUploads();
  displayRedirectWelcome();
});
})();
