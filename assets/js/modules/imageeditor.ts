/**
 * Image editor module, the image viewing / editing interface.
 */

const imageEditor = (pasteboard: any) => {
  const MAX_WIDTH_RATIO = 0.8;
  const MAX_HEIGHT_RATIO = 0.8;
  const WINDOW_MAX_WIDTH = 600;
  const WINDOW_MAX_HEIGHT = 600;
  const SCROLL_SPEED = 25;
  const TEMPLATE_URL = "jstemplates/imageeditor.tmpl";

  let image: HTMLImageElement | null = null;
  let isScrollDragging = false;
  let isCropDragging = false;
  let dragDirection: "x" | "y" | null = null;
  let selectionScrollInterval: number | null = null;
  let cropIntentTimeout: number | null = null;

  const scrollable = { x: false, y: false };
  const dragOffset = { x: 0, y: 0 };
  const imagePosition = { x: 0, y: 0 };
  const mousePosition = { x: 0, y: 0 };

  // The crop selection that appears when the user mouse drags on the image
  const cropSelection = (() => {
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;
    let style: { x: number; y: number; width: number; height: number } | null = null;
    let element: JQuery | null = null;
    let isCropped = false;

    // Sets the CSS styles from the coordinates / dimensions
    const updateStyle = () => {
      style!.x = x;
      style!.y = y;
      style!.width = width;
      style!.height = height;

      // We can't have negative dimensions, so
      // we need to invert the dimensions
      // and set the coordinates accordingly
      if (style!.width < 0) {
        style!.width *= -1;
        style!.x -= style!.width;
      }
      if (style!.height < 0) {
        style!.height *= -1;
        style!.y -= style!.height;
      }

      // Cap values
      if (style!.x < 0) {
        style!.width += style!.x;
        style!.x = 0;
      }

      if (style!.x + style!.width > image!.width) {
        style!.width = image!.width - style!.x;
      }

      if (style!.y < 0) {
        style!.height += style!.y;
        style!.y = 0;
      }

      if (style!.y + style!.height > image!.height) {
        style!.height = image!.height - style!.y;
      }

      element!.css({
        left: style!.x,
        top: style!.y,
        width: style!.width,
        height: style!.height,
        "background-position": `-${style!.x}px -${style!.y}px`,
      });

      // Hide the selection when it isn't wide/high enough
      if (style!.width < 5 || style!.height < 5) {
        if (isCropped) {
          $imageEditor.removeClass("cropped");
          isCropped = false;
          if (cropIntentTimeout !== null) clearTimeout(cropIntentTimeout);
          cropIntentTimeout = setTimeout(() => {
            setUploadText(isCropped);
          }, 200);
        }
      } else {
        if (!isCropped) {
          $imageEditor.addClass("cropped");
          isCropped = true;
          if (cropIntentTimeout !== null) clearTimeout(cropIntentTimeout);
          cropIntentTimeout = setTimeout(() => {
            setUploadText(isCropped);
          }, 200);
        }
      }
    };

    return {
      getCropCoordinates: () => (isCropped ? style : null),
      reset: () => {
        style = { x: 0, y: 0, width: 0, height: 0 };
        isCropped = false;
      },
      init: (startX: number, startY: number) => {
        element = $image.find(".crop-selection");
        x = startX;
        y = startY;
        width = 0;
        height = 0;

        updateStyle();
      },
      resize: (newX: number, newY: number) => {
        width = newX - x;
        height = newY - y;
        updateStyle();
      },
    };
  })();

  let $imageEditor: JQuery | null = null;
  let $imageContainer: JQuery | null = null;
  let $instructions: JQuery | null = null;
  let $image: JQuery | null = null;
  const $scrollBar = {
    x: { bar: null as JQuery | null, track: null as JQuery | null, handle: null as JQuery | null },
    y: { bar: null as JQuery | null, track: null as JQuery | null, handle: null as JQuery | null },
  };

  let $uploadButton: JQuery | null = null;
  const $window = $(window);
  const $document = $(document);

  // Use 3D translate transforms when possible, fall back to 2D
  const compatibleTranslate = (x: number, y: number, z: number) =>
    Modernizr.csstransforms3d ? `translate3d(${x}px, ${y}px, ${z}px)` : `translate(${x}px, ${y}px)`;

  // Add all the event listeners, use a namespace to make removing them easier
  const addEvents = () => {
    $window.on("resize.imageeditorevent", () => {
      setPosition();
      setSize();
      scrollImage(0, 0);
    });

    $document
      .on("click.imageeditorevent", ".image-editor .confirm", () => $(self).trigger("confirm"))
      .on("click.imageeditorevent", ".image-editor .cancel", () => $(self).trigger("cancel"))
      .on(
        "mousewheel.imageeditorevent" + ("onmousewheel" in document ? "" : " DOMMouseScroll.imageeditorevent"),
        ".image-container",
        scrollWheelHandler
      )
      .on("mousedown.imageeditorevent", ".image-container .image", mouseCropHandler)
      .on("mousedown.imageeditorevent", ".image-editor .y-scroll-bar, .image-editor .x-scroll-bar", mouseScrollHandler)
      .on("mouseup.imageeditorevent", () => {
        if (isScrollDragging) isScrollDragging = false;
        if (isCropDragging) {
          isCropDragging = false;
          if (selectionScrollInterval !== null) clearInterval(selectionScrollInterval);
        }
      })
      .on("mousemove.imageeditorevent", (e) => {
        if (isScrollDragging) dragScrollHandler(e);
        if (isCropDragging) dragCropHandler(e);
      });
  };

  // Remove the events
  const removeEvents = () => {
    $document.off(".imageeditorevent");
    $window.off(".imageeditorevent");
  };

  // Cache the needed jQuery element objects for quicker access
  const cacheElements = (element: string) => {
    $imageEditor = $(element);
    $imageContainer = $imageEditor.find(".image-container");
    $image = $imageContainer.find(".image");
    $instructions = $imageContainer.find(".instructions");
    for (const coordinate of ["x", "y"]) {
      const bar = $scrollBar[coordinate as "x" | "y"];
      bar.bar = $imageEditor.find(`.${coordinate}-scroll-bar`);
      bar.track = bar.bar.find(".track");
      bar.handle = bar.track.find(".handle");
    }

    $uploadButton = $imageEditor.find(".confirm");
  };

  // Changes the upload button text
  const setUploadText = (isCropped: boolean) => {
    const buttonWidth = isCropped ? 180 : 100;
    if ($uploadButton!.data("cropped") === isCropped) return;
    $uploadButton!.data("cropped", isCropped);
    $uploadButton
      .find("span")
      .stop()
      .transition({ opacity: 0 }, 150, function (this: HTMLElement) {
        $(this)
          .text($(this).data(`${isCropped ? "cropped" : "regular"}-text`))
          .css("width", `${buttonWidth - 40}px`);

        $uploadButton.transition({ width: `${buttonWidth}px` }, function (this: HTMLElement) {
          $(this).find("span").stop().transition({ opacity: 1 }, 150);
        });
      });
  };

  // Sets the vertical position of the image editor window
  const setPosition = () => {
    let y = $window.height() / 2 - $imageEditor!.outerHeight() / 2 - 50;
    if ($imageEditor!.outerHeight() > $window.height()) y = 0;
    $imageEditor!.css({
      top: y,
    });
  };

  // Resizes the image editor window, adds scrollbars if needed
  const setSize = () => {
    const maxWidth = MAX_WIDTH_RATIO * Math.max($window.width(), WINDOW_MAX_WIDTH);
    const maxHeight = MAX_HEIGHT_RATIO * Math.max($window.height(), WINDOW_MAX_HEIGHT);

    let width = Math.min(maxWidth, image!.width);
    let height = Math.min(maxHeight, image!.height);

    $imageEditor!.css({
      width,
      height,
    });

    // TODO: Make this less repetitive
    if ($imageContainer!.width() < image!.width) {
      scrollable.x = true;
      $imageEditor!.addClass("scroll-x");
      const newHeight = height - $scrollBar.x.bar!.outerHeight();
      if (newHeight < maxHeight) {
        $imageEditor!.css("height", height + $scrollBar.x.bar!.outerHeight());
        $imageContainer!.css("height", height);
      } else {
        $imageContainer!.css("height", height - (newHeight - maxHeight));
      }

      // Make the scroll handle represent the visible image width
      // relative to the track
      $scrollBar.x.handle!.css("width", ($imageContainer!.width() / image!.width) * $scrollBar.x.track!.width());
    } else {
      $imageEditor!.removeClass("scroll-x");
      $imageContainer!.css("height", "");
      scrollable.x = false;
    }

    if ($imageContainer!.height() < image!.height) {
      scrollable.y = true;
      $imageEditor!.addClass("scroll-y");
      const newWidth = width - $scrollBar.y.bar!.outerWidth();
      if (newWidth < maxWidth) {
        $imageEditor!.css("width", width + $scrollBar.y.bar!.outerWidth());
        $imageContainer!.css("width", width);
      } else {
        $imageContainer!.css("width", width - (newWidth - maxWidth));
      }

      // Make the scroll handle represent the visible image height
      // relative to the track
      $scrollBar.y.handle!.css("height", ($imageContainer!.height() / image!.height) * $scrollBar.y.track!.height());
    } else {
      $imageEditor!.removeClass("scroll-y");
      $imageContainer!.css("width", "");
      scrollable.y = false;
    }
  };

  // Handles mouse scrolling (clicking and dragging)
  const mouseScrollHandler = (e: any) => {
    if (e.button !== 0) return;
    const $target = $(e.currentTarget);

    // TODO: Make this less repetitive
    if ($target.hasClass("y-scroll-bar")) {
      const handleTop = $scrollBar.y.handle!.offset().top;
      const cursorY = e.clientY + $window.scrollTop();
      if (handleTop <= cursorY && cursorY <= handleTop + $scrollBar.y.handle!.height()) {
        dragDirection = "y";
        dragOffset.y = cursorY - handleTop;
        isScrollDragging = true;
      } else {
        // Ignore clicks on the padding
        if (cursorY > $scrollBar.y.bar!.offset().top + $scrollBar.y.bar!.height()) return;
        if (cursorY < handleTop) {
          scrollImage(0, SCROLL_SPEED * 4);
        } else {
          scrollImage(0, -SCROLL_SPEED * 4);
        }
      }
    } else if ($target.hasClass("x-scroll-bar")) {
      const handleLeft = $scrollBar.x.handle!.offset().left;
      const cursorX = e.clientX + $window.scrollLeft();
      if (handleLeft <= cursorX && cursorX <= handleLeft + $scrollBar.x.handle!.width()) {
        dragDirection = "x";
        dragOffset.x = cursorX - handleLeft;
        isScrollDragging = true;
      } else {
        // Ignore clicks on the padding
        if (cursorX > $scrollBar.x.bar!.offset().left + $scrollBar.x.bar!.width()) return;
        if (cursorX < handleLeft) {
          scrollImage(SCROLL_SPEED, 0);
        } else {
          scrollImage(-SCROLL_SPEED, 0);
        }
      }
    }
  };

  // Handles mouse wheel scrolling.
  // (Scrolling while holding shift scrolls the image sideways)
  const scrollWheelHandler = (e: any) => {
    e.preventDefault();
    let deltaX: number = e.originalEvent.wheelDeltaX || 0;
    let deltaY: number = e.originalEvent.wheelDeltaY;
    if (deltaY === undefined) deltaY = e.originalEvent.wheelDelta || 0;

    // Firefox
    if (e.type === "DOMMouseScroll") {
      // Set better delta values than what firefox throws out
      const direction = -e.originalEvent.detail / Math.abs(e.originalEvent.detail);
      if (e.originalEvent.axis === e.originalEvent.HORIZONTAL_AXIS) {
        deltaX = direction * 100;
      } else {
        deltaY = direction * 100;
      }
    }

    if (e.originalEvent.shiftKey) {
      deltaX = deltaX || deltaY;
      deltaY = 0;
    }

    scrollImage(deltaX / 2, deltaY / 2);
  };

  // Handles dragging of the scroll bar handles
  const dragScrollHandler = (e: any) => {
    if (dragDirection === "x") {
      const x =
        ((e.clientX + $window.scrollLeft() - dragOffset.x - $scrollBar.x.track!.offset().left) /
          $scrollBar.x.track!.width()) *
        image!.width;
      scrollImageTo(x, undefined);
    } else if (dragDirection === "y") {
      const y =
        ((e.clientY + $window.scrollTop() - dragOffset.y - $scrollBar.y.track!.offset().top) /
          $scrollBar.y.track!.height()) *
        image!.height;
      scrollImageTo(undefined, y);
    }
  };

  // Scrolls the image by the given number of pixels
  const scrollImage = (x: number, y: number) => {
    if (!scrollable.x) x = 0;
    if (!scrollable.y) y = 0;

    const newX = -(imagePosition.x + x);
    const newY = -(imagePosition.y + y);

    scrollImageTo(newX, newY);
  };

  // Scrolls the image to the given coordinates
  const scrollImageTo = (x?: number, y?: number) => {
    let currentX = x;
    let currentY = y;
    if (currentX === undefined) currentX = -imagePosition.x;
    if (currentY === undefined) currentY = -imagePosition.y;

    // Cap values
    currentX = Math.max(0, Math.min(currentX, $image!.width() - $imageContainer!.width()));
    currentY = Math.max(0, Math.min(currentY, $image!.height() - $imageContainer!.height()));

    // Round values
    currentX = Math.round(currentX);
    currentY = Math.round(currentY);

    imagePosition.x = -currentX;
    imagePosition.y = -currentY;

    // Use 3D transforms for GPU acceleration
    $image!.css("transform", compatibleTranslate(-currentX, -currentY, 0));

    // Set the handle positions
    let val = Math.round(
      (currentY / ($image!.height() - $imageContainer!.height())) *
        ($scrollBar.y.track!.height() - $scrollBar.y.handle!.height())
    );
    $scrollBar.y.handle!.css("transform", compatibleTranslate(0, val, 0));
    val = Math.round(
      (currentX / ($image!.width() - $imageContainer!.width())) *
        ($scrollBar.x.track!.width() - $scrollBar.x.handle!.width())
    );
    $scrollBar.x.handle!.css("transform", compatibleTranslate(val, 0, 0));
  };

  // Handle cropping (click)
  // Sets the crop selection starting position
  const mouseCropHandler = (e: any) => {
    isCropDragging = true;
    mousePosition.x = e.clientX + $window.scrollLeft();
    mousePosition.y = e.clientY + $window.scrollTop();

    cropSelection.init(mousePosition.x - $image!.offset().left, mousePosition.y - $image!.offset().top);

    selectionScrollInterval = setInterval(selectionDragScroll, 1000 / 60);
  };

  // Handle cropping (drag)
  const dragCropHandler = (e: any) => {
    mousePosition.x = e.clientX + $window.scrollLeft();
    mousePosition.y = e.clientY + $window.scrollTop();

    cropSelection.resize(mousePosition.x - $image!.offset().left, mousePosition.y - $image!.offset().top);
  };

  // Scrolls the image if the user is dragging
  // the selection outside the image container area
  const selectionDragScroll = () => {
    const scrollDir = { x: 0, y: 0 };

    if (mousePosition.x < $imageContainer!.offset().left) {
      scrollDir.x = 1 * scrollSpeedAdjustion($imageContainer!.offset().left - mousePosition.x);
    } else if (mousePosition.x > $imageContainer!.offset().left + $imageContainer!.width()) {
      scrollDir.x = -1 * scrollSpeedAdjustion(mousePosition.x - $imageContainer!.offset().left - $imageContainer!.width());
    }

    if (mousePosition.y < $imageContainer!.offset().top) {
      scrollDir.y = 1 * scrollSpeedAdjustion($imageContainer!.offset().top - mousePosition.y);
    } else if (mousePosition.y > $imageContainer!.offset().top + $imageContainer!.height()) {
      scrollDir.y = -1 * scrollSpeedAdjustion(mousePosition.y - $imageContainer!.offset().top - $imageContainer!.height());
    }

    scrollImage(SCROLL_SPEED * scrollDir.x, SCROLL_SPEED * scrollDir.y);
    cropSelection.resize(mousePosition.x - $image!.offset().left, mousePosition.y - $image!.offset().top);
  };

  // Returns a ratio for adjusting the scrollspeed
  // when dragging the selection outside of the container
  const scrollSpeedAdjustion = (distance: number) => {
    if (distance > 0 && distance < 10) return 0.1;
    if (distance < 100) return distance / 100;
    return 1.0;
  };

  // Loads an image and sets up the editor
  const loadImage = (img: string) => {
    image = new Image();
    image.src = img;
    image.onload = () => {
      pasteboard.template.compile(TEMPLATE_URL, { url: img }, (compiledTemplate: string) => {
        cacheElements(compiledTemplate);

        if (image!.width < 200 || image!.height < 100) $instructions!.hide();

        $imageEditor!.appendTo("body");
        $image!.css({
          width: image!.width,
          height: image!.height,
        });

        setSize();
        setPosition();
      });
    };
  };

  const self = {
    // Initializes the image editor.
    // Loads and displays the given image
    init: (img: string) => {
      // Start loading the template
      pasteboard.template.load(TEMPLATE_URL);
      loadImage(img);

      // Reset values
      isScrollDragging = false;
      scrollable.x = false;
      scrollable.y = false;
      dragOffset.x = 0;
      dragOffset.y = 0;
      imagePosition.x = 0;
      imagePosition.y = 0;
      cropSelection.reset();

      addEvents();
    },

    // Hides the image editor and cleans up event listeners
    hide: (callback?: () => void) => {
      removeEvents();
      $imageEditor!.transition(
        {
          opacity: 0,
          scale: 0.95,
        },
        500,
        function (this: HTMLElement) {
          $imageEditor!.remove();
          if (callback) callback();
        }
      );
    },

    // Uploads the image
    uploadImage: (callback: (result: any) => void) => {
      pasteboard.fileHandler.uploadFile(cropSelection.getCropCoordinates(), callback);
    },

    getImage: () => image,
  };

  return self;
};

window.moduleLoader.addModule("imageEditor", imageEditor);