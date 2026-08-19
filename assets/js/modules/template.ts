/**
 * Micro-templating engine based on John Resig's
 * blog post "JavaScript Micro-Templating":
 * http://ejohn.org/blog/javascript-micro-templating/
 *
 * Loads, caches and compiles templates. The compiled
 * template is NOT cached, just the template itself.
 */

const template = (pasteboard: any) => {
  const cache: { [url: string]: string } = {};
  const loading: { [url: string]: JQueryDeferred } = {};

  const compile = (str: string, data: any) => {
    // RegEx magic combined with the Function constructor code evaluator
    return new Function(
      "obj",
      "var p=[],print=function(){p.push.apply(p,arguments);};" +
        "with(obj){p.push('" +
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%")
          .join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t")
          .join("');")
          .split("%>")
          .join("p.push('")
          .split("\r")
          .join("\\'") +
        "');}return p.join('');"
    )(data);
  };

  const self = {
    // Loads a template and adds it to the cache.
    // Returns the jquery XHR object to allow
    // more event listeners to be added.
    // 	TODO: handle load on already cached template
    load: (templateURL: string) => {
      // Prevent multiple loads on the same template
      if (loading[templateURL]) return loading[templateURL];
      loading[templateURL] = $.get(templateURL)
        .success((loadedTemplate: string) => {
          cache[templateURL] = loadedTemplate;
          delete loading[templateURL];
        })
        .error((error) => {
          log("Error: ", error);
        });
      return loading[templateURL];
    },

    // Compiles a template with the given data object
    // and calls the callback function with the result.
    //
    // The template parameter can either be a file name
    // (.tmpl) or a direct template string.
    compile: (templateArg: string, data: any, callback: (result: string) => void) => {
      const isTemplateFile = /^(\w|\/)*\.tmpl$/.test(templateArg);
      if (isTemplateFile) {
        if (cache[templateArg]) {
          callback(compile(cache[templateArg], data));
        } else {
          self.load(templateArg).success((loadedTemplate: string) => {
            callback(compile(loadedTemplate, data));
          });
        }
      } else {
        callback(compile(templateArg, data));
      }

      return true;
    },
  };

  return self;
};

window.moduleLoader.addModule("template", template);