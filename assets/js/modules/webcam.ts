/**
 * Webcam module, allows the user to take
 * pictures with their webcam
 */

const webcam = (pasteboard: any) => {
  const TEMPLATE_URL = "jstemplates/webcamwindow.tmpl";

  let video: HTMLVideoElement | null = null;
  let stream: any = null;

  let $webcamWindow: JQuery | null = null;
  let $cancelButton: JQuery | null = null;
  let $confirmButton: JQuery | null = null;
  const $pasteboard = $(pasteboard);

  // Unprefix methods
  const navigatorAny: any = navigator as any;
  navigatorAny.getUserMedia =
    navigatorAny.getUserMedia ||
    navigatorAny.webkitGetUserMedia ||
    navigatorAny.mozGetUserMedia ||
    navigatorAny.msGetUserMedia;

  // Request access to the webcam
  //
  // CURRENT DRAWBACK:
  // There doesn't seem to be a way to check if the user
  // actually has a webcam before requesting access to one,
  // would be nice to know so that the 'Use webcam' button
  // could be hidden
  const requestWebcam = () => {
    navigatorAny.getUserMedia(
      {
        video: true,
        audio: false,
      },
      (localMediaStream: any) => {
        stream = localMediaStream;
        $pasteboard.trigger("webcaminitiated");
      },
      () => {
        $pasteboard.trigger("webcamunavailable");
      }
    );
  };

  // Stream the video from the webcam to the video element
  const streamVideo = () => {
    if ((video as any).mozSrcObject === null) {
      (video as any).mozSrcObject = stream;
    } else if (window.URL) {
      video!.src = window.URL.createObjectURL(stream);
    } else {
      video!.src = stream;
    }

    $(video).one("canplay", () => {
      displayWindow();
      video!.play();
    });
  };

  // Display the webcam window
  const displayWindow = () => {
    $pasteboard.trigger("webcamwindowshow", { webcamWindow: $webcamWindow });
    $("body").append($webcamWindow);
    setPosition();
    $(window).on("resize", setPosition);

    $cancelButton!.on("click", () => $pasteboard.trigger("cancel"));
    $confirmButton!.on("click", () => pasteboard.fileHandler.readVideo(video));
  };

  // Center the window
  const setPosition = () => {
    $webcamWindow!.css({
      top: $(window).outerHeight() / 2 - $webcamWindow!.outerHeight() / 2 - 50,
      left: $(window).outerWidth() / 2 - $webcamWindow!.outerWidth() / 2,
    });
  };

  const self = {
    isSupported: () => !!navigatorAny.getUserMedia && !!window.dataURLtoBlob,
    showButton: () => {
      if (!self.isSupported()) return;
      $(".webcam-button")
        .show()
        .css("opacity", 0)
        .transition({
          opacity: 1,
        }, 500);
    },
    hideButton: () => $(".webcam-button").hide(),

    hide: (callback?: () => void) => {
      $webcamWindow!.transition(
        {
          opacity: 0,
          scale: 0.95,
        },
        500,
        () => {
          $webcamWindow!.remove();
          if (callback) callback();
        }
      );
    },

    // Stop the stream (turns off the webcam)
    stop: () => {
      if (stream && stream.stop) stream.stop();
    },

    // Start streaming the webcam video and display the window
    start: () => {
      pasteboard.template.compile(TEMPLATE_URL, {}, (compiledTemplate: string) => {
        $webcamWindow = $(compiledTemplate);
        $cancelButton = $webcamWindow.find(".cancel");
        $confirmButton = $webcamWindow.find(".confirm");

        video = $webcamWindow.find("video")[0] as HTMLVideoElement;
        streamVideo();
      });
    },

    init: () => {
      if (!self.isSupported()) return;
      pasteboard.template.load(TEMPLATE_URL);
      $(".webcam-button").click(requestWebcam);
    },
  };

  return self;
};

window.moduleLoader.addModule("webcam", webcam);