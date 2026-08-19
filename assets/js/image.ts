/**
 * Uploaded image page entry point.
 */
(() => {
  const $window = $(window);
let $imageContainer: JQuery | null = null;
let $image: JQuery | null = null;
let $modalWindow: JQuery | null = null;
let fullScreen = false;
const URLObject = window.URL || window.webkitURL;

const setSize = () => {
  const width = $(window).outerWidth();
  const height = Math.min($(window).outerHeight(), ($image!.outerHeight() + 65));

  $imageContainer!.css({
    width,
    height,
  });
};

const setPosition = () => {
  if ($imageContainer!.outerHeight() < $window.outerHeight()) {
    $imageContainer!.css({
      top: $window.outerHeight() / 2 - $imageContainer!.outerHeight() / 2,
    });
  } else {
    $imageContainer!.css({
      top: "",
    });
  }
};

const blobConstructorSupported = () => {
  try {
    new (window as any).Blob();
    return true;
  } catch (e) {
    return false;
  }
};

const arrayBufferResponseSupported = () => {
  try {
    (new XMLHttpRequest()).responseType = "arraybuffer";
    return true;
  } catch (e) {
    return false;
  }
};

const progressBarSupported = () =>
  !!(
    "FormData" in window && // XHR 2
    window.ArrayBuffer &&
    URLObject &&
    window.Blob &&
    blobConstructorSupported() &&
    arrayBufferResponseSupported()
  );

const loadImage = () => {
  const spinner = new Spinner({
    color: "#eee",
    lines: 12,
    length: 5,
    width: 3,
    radius: 6,
    hwaccel: true,
    className: "spin",
  }).spin($(".spinner")[0] as HTMLElement);

  $image!.on("load", () => {
    spinner.stop();
  });

  $image!.attr("src", $image!.data("src"));
};

const loadImageWithProgress = () => {
  const $progress = $(".progress");
  const $progressBar = $progress.find(".bar");
  $progress.addClass("appear");

  const xhr = new XMLHttpRequest();
  xhr.responseType = "arraybuffer";
  const imageSource = $image!.data("src");

  xhr.addEventListener("progress", (e: any) => {
    $progressBar.css("width", (e.loaded / e.total) * 100 + "%");
  });

  xhr.addEventListener("load", () => {
    const opts: any = {};
    const typeMatch = imageSource.match(/.*\.(.*)$/);
    const type = typeMatch ? typeMatch[1] : undefined;
    if (type) opts["type"] = `image/${type}`;

    $image!.attr("src", URLObject!.createObjectURL(new Blob([xhr.response], opts)));
    $progressBar.addClass("done");
  });

  xhr.open("GET", imageSource);
  xhr.send();

  $image!.on("load", () => {
    $progress.hide();
  });
};

const imageLoaded = () => {
  setPosition();
  $image!.addClass("appear");
  window.drawBackgroundOverlay();
};

const confirmDelete = function (this: HTMLElement) {
  const image = $(this).data("image");
  pasteboard.modalWindow.show(
    "confirm",
    {
      content: "Are you sure you want to delete this image?",
      showConfirm: true,
      confirmText: "Yes, delete",
      showCancel: true,
      cancelText: "No, cancel",
    },
    () => {}
  );

  $modalWindow!.on("confirm", () => {
    $modalWindow!.off("confirm cancel");
    $.post(`images/${image}/delete`, () => {
      window.location.href = "/";
    });
  });

  $modalWindow!.on("cancel", () => {
    $modalWindow!.off("confirm cancel");
    pasteboard.modalWindow.hide();
  });
};

const toggleFullscreen = () => {
  fullScreen = !fullScreen;
  $("body").toggleClass("full-screen");
  $(window).scrollTop(0);

  if (fullScreen) {
    setSize();
    $window.on("resize", setSize);
  } else {
    $window.off("resize", setSize);
    $imageContainer!.css({
      width: "",
      height: "",
    });
  }

  setPosition();
};

const getViews = () => {
  if (!window.location.pathname) return;
  $.getJSON(`analytics/views/${location.pathname.replace("/", "")}`, (response: any) => {
    $(".views").addClass("appear").find(".num").text(response.views || 1);
  });
};

const pasteboard: Pasteboard = {};
window.moduleLoader.load("analytics", pasteboard);
window.moduleLoader.load("template", pasteboard);
window.moduleLoader.load("modalWindow", pasteboard);

$(() => {
  $imageContainer = $(".image-container");
  $image = $imageContainer.find(".image");

  if (progressBarSupported()) {
    loadImageWithProgress();
  } else {
    loadImage();
  }

  getViews();

  $image.on("load", imageLoaded);
  $image.on("error", () => $("body").addClass("broken"));

  pasteboard.analytics.init();
  pasteboard.modalWindow.init();
  $modalWindow = $(pasteboard.modalWindow);

  $window.on("resize", setPosition);
  $image.on("click", toggleFullscreen);
  $(".delete").click(confirmDelete);
});
})();