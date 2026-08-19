/**
 * Tracks events with Google Analytics
 */

const analytics = (pasteboard: any) => {
  let page = "";
  let $document: JQuery | null = null;
  const $pasteboard = $(pasteboard);
  const loggedErrors: { [message: string]: boolean } = {};

  const track = (category: string, action: string, label?: string, value?: number) => {
    const eventArray: any[] = ["_trackEvent", `${page} - ${category}`, action];
    if (label) eventArray.push(label);
    if (value) eventArray.push(parseInt(value + "", 10));
    _gaq.push(eventArray);
  };

  const actionString = (action: any) => {
    if (action.paste) return "Copy and Paste";
    if (action.drop) return "Drag and Drop";
    if (action.webcam) return "Webcam";
    if (action.extension) return "Extension";
    return "Unknown Action";
  };

  const trackOutboundLinks = () => {
    $document!.on("click", "a[data-track]", (e) => {
      const $this = $(e.currentTarget);
      track("Outbound Link", "Click", $this.data("track"));
      if ($this.attr("target") !== "__blank" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Give Google Analytics some time to track the event
        // (probably not the best way to do this)
        setTimeout(() => {
          window.location.href = $this.attr("href");
        }, 150);
      }
    });
  };

  const trackInsertedImages = () => {
    $pasteboard.on({
      filetoolarge: (e, eventData: any) => {
        const kB = eventData.size / 1024;
        track("Image Inserted", actionString(eventData.action), "Too Large", kB);
      },
      imageinserted: (e, eventData: any) => {
        const kB = eventData.size / 1024;
        track("Image Inserted", actionString(eventData.action), "Successfully", kB);
      },
    });
  };

  const trackUploadedImages = () => {
    $pasteboard.on("imageuploaded", () => {
      track("Image Uploaded", "N/A");
    });
  };

  const trackErrors = () => {
    $(window).on("error", (e) => {
      const originalEvent: any = e.originalEvent;
      // Prevent logging the same error multiple times
      if (originalEvent && !loggedErrors[originalEvent.message]) {
        loggedErrors[originalEvent.message] = true;
        track("Error", originalEvent.message, `${originalEvent.filename} :${originalEvent.lineno}`);
      }
    });
  };

  const self = {
    init: () => {
      if (!window._gaq) return;
      $document = $(document);
      page = $("body").data("page");

      trackOutboundLinks();
      trackInsertedImages();
      trackUploadedImages();
      trackErrors();
    },
  };

  return self;
};

window.moduleLoader.addModule("analytics", analytics);