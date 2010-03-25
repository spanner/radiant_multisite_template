document.observe('dom:loaded', function() {
  
  when('path_slug', function(path) {
    var slug = $('page_slug');
    if (!slug) return;
    new Form.Element.Observer(slug, 0.15, function() {
      path.update(slug.value);
    });
  });

});