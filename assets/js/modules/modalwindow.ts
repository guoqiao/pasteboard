/**
 * Modal window module, displays a
 * modal window with the given content
 */

const modalWindow = (pasteboard: any) => {
  const TEMPLATE_URL = "jstemplates/modalwindow.tmpl";
  const templateDefaults = {
    title: "",
    content: "",
    showCancel: false,
    showClose: false,
    showConfirm: false,
    showLink: false,
    confirmText: "OK",
    cancelText: "Cancel",
    closeText: "Close",
    linkText: "",
  };

  const $document = $(document);
  const $window = $(window);
  let $modal: JQuery | null = null;
  let $modalWindow: JQuery | null = null;

  const setPosition = () => {
    const top = Math.max(50, $window.outerHeight() / 2 - $modalWindow!.outerHeight() / 2);
    $modalWindow!.css({ top });
  };

  const self = {
    init: () => {
      pasteboard.template.load(TEMPLATE_URL);
    },

    // Displays the modal window of the given type.
    // Compiles the modal window template using the params
    show: (modalType: string, params: any, callback?: (modal: JQuery) => void) => {
      if ($modal) self.hide();
      pasteboard.template.compile(
        TEMPLATE_URL,
        $.extend({ modalType }, templateDefaults, params),
        (compiledTemplate: string) => {
          $modal = $(compiledTemplate);
          $modalWindow = $modal.find(".modal-window");

          $("body").append($modal);
          setPosition();

          // Events
          $window.on("resize.modalwindowevents", setPosition);
          $document
            .on("click.modalwindowevents", ".modal-window .cancel", () => $(self).trigger("cancel"))
            .on("click.modalwindowevents", ".modal-window .confirm", () => $(self).trigger("confirm"))
            .on("click.modalwindowevents", ".modal-window .close", () => self.hide());

          if (params.showClose) {
            // Allow clicking outside to close
            $document
              .on("click.modalwindowevents", () => self.hide())
              .on("click.modalwindowevents", ".modal-window", (e) => e.stopPropagation());
          }

          if (callback) callback($modal);
        }
      );
    },

    hide: () => {
      if (!$modalWindow) return;
      $modalWindow.transition({
        opacity: 0,
        scale: 0.85,
      }, 300);

      const currentModal = $modal;
      currentModal!.transition(
        {
          opacity: 0,
        },
        500,
        () => {
          currentModal!.remove();
        }
      );

      $document.off(".modalwindowevents");
      $window.off(".modalwindowevents");
    },
  };

  return self;
};

window.moduleLoader.addModule("modalWindow", modalWindow);