jetpack.future.import("menu");

jetpack.menu.context.page.add(function(target)({
  label: "Google Reader to Delicious",
  command: function(){
    var win = target.window;
    var tagsArr = [];

    win.status = "Retrieving Google Reader tags and subscriptions...";
    $.ajax({type: "GET",
	    url: "http://www.google.com/reader/api/0/tag/list",
	    async: false,
	    success: function(list) {
                jQuery.each($(list).find("string[name=id]:contains('/label/')"),
                  function() {
                    var path = $(this).get(0).textContent;
                    tagsArr.push({path : path, label : path.replace(/^.*\//, ''), links : []});
                });
              }});

    var totalLinks = 0;
    for (var i in tagsArr) {
      win.status = "Fetching " + (i + 1) + "/" + tagsArr.length + " tags, current is " + tagsArr[i].label + "...";
      var continuationParam = "";
      do {
        $.ajax({type: "GET",
                url: "http://www.google.com/reader/atom/" + tagsArr[i].path + continuationParam,
                async: false,
                success: function(feeds) {
                  var currTotalLinks = totalLinks;
                  jQuery.each($(feeds).find("entry"), function() {
                    if ($(this).find("category[label='reading-list']").length == 0) {
                      tagsArr[i].links.push($($(this).find("link").get(0)).attr("href"));
                      ++totalLinks;
                    }
                  });
                  
                  continuationParam = "";
                  if (currTotalLinks != totalLinks) {
                    var c = $(feeds).find("gr\\:continuation");
                    if (c.length != 0) {
                      continuationParam = "?c=" + c.get(0).textContent;
                    }
                  }
                }});
      } while (continuationParam != "");
    }

    if (win.confirm("Will be imported " + totalLinks + " links to delicious.\nThe operation could take a long time")) {
      for (var i in tagsArr) {
        for (var j in tagsArr[i].links) {
          s += "\n    " + tagsArr[i].links[j];
      //$.ajax({type: "GET",
      //        url: "https://api.del.icio.us/v1/posts/add?"
      //          + "url=" + encodeURIComponent(tagsArr[i].links[j])
      //          + "&description=" + encodeURIComponent(tagsArr[i].links[j])
      //          + "&tags=" + encodeURIComponent("greader_" + tagsArr[i].label),
      //        async: false
      //        });
        }
      }
    }

    win.status = "";
    var s = "";
    var venn = null;

    for (var i in tagsArr) {
      s += "\n" + tagsArr[i].label + " (" + tagsArr[i].links.length + ")";
      for (var j in tagsArr[i].links) {
        s += "\n    " + tagsArr[i].links[j];
      }
      if (tagsArr[i].label == "venn") {
	venn = tagsArr[i];
      }
    }
    
    //win.alert("links " + s);
    //console.log(s);
    
    if (venn) {
      console.log("venn url " + venn.links[0] + " tags " + venn.label);

      var res = $.ajax({type: "GET",
              url: "https://api.del.icio.us/v2/posts/add?"
                + "url=" + encodeURIComponent(venn.links[0])
                + "&description=" + encodeURIComponent(venn.links[0])
                + "&tags=" + encodeURIComponent("greader_" + venn.label),
	      success: function(msg){ console.log( "Data Saved: " + msg ); },
              async: false
              })
      .responseText;
      console.log("res " + res);
    }
  }
}));
