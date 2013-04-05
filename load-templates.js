(function(root) {

var is_node = typeof require != 'undefined';
if (is_node)
  module.exports = loadTemplates;
else
  root.loadTemplates = loadTemplates;
var join = is_node ? require('path').join : function(root, path) { return root + '/' + path; };

var nested_regex = /\{\{(\{)?\s*(.+?)\.html\s*\}\}\}?/gi;
var loading = 'LOADING...';

// TODO: pull out the template-loader into a separate npm module
// so glass-templates can be passed the templates
function loadTemplates(path, options, callback) {
  if (!options)
    options = {};
  var templates = options.templates = options.templates || {};

  if (Array.isArray(path)) {
    return path.forEach(function(path) {
      loadTemplates(path, options, callback);
    });
  }

  templates[path] = loading;
  function cb(err, template) {
    if (err) return callback(err);

    templates[path] = template;

    var nested_templates = template.match(nested_regex);
    nested_templates.forEach(function(path) {
      var separator_ix = path.indexOf(' ');
      if (separator_ix > -1)
        path = path.slice(separator_ix + 1);
      if (!(path in templates))
        loadTemplates(path, options, callback);
    });

    for (var path in templates)
      if (templates[path] == loading)
        return;
    
    callback(null, templates);
  }

  if (options.root)
    path = join(options.root, path);

  if (is_node)
    require('fs').readFile(path, 'utf-8', cb);
  else if (root.$)
    $.ajax(path, ajaxSettings(cb));
  else
    throw new Error('When running in the browser, jQuery/Zepto is necessary to pull in templates via ajax');
}

function ajaxSettings(callback) {
  return {
    'success': function(data) {
      callback(null, data);
    },
    'error': function(jqXHR, textStatus, errorThrown) {
      callback(errorThrown);
    }
  }
}

})(this);