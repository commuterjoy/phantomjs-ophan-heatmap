
//create new webpage object
var page = new WebPage();
var i = 0;

//load the page
page.open('http://m.guardian.co.uk/', function (status) {

        page.onConsoleMessage = function(msg) {
          console.log(msg);
        };

        page.onError = function(msg, trace) {
            console.error(msg);    
            phantom.exit()
        };

        page.onLoadFinished = function(status) {
            console.log('Status: ' + status);
            page.render((new Date().toISOString()) +'.png');
            phantom.exit()
            };    
        
        var c = 1;
        page.evaluate(function(c)  { 
            
            console.log(c);

            var statsServer = "http://heatmap.ophan.co.uk";

            // a function that loads jQuery and calls a callback function when jQuery has finished loading
            function addLibraries(callback) {
              var jqueryLoaded = false;
              var underscoreLoaded = false;
              var jquery = document.createElement("script");
              jquery.setAttribute("src", "http://cdnjs.cloudflare.com/ajax/libs/zepto/1.0rc1/zepto.min.js");
              jquery.addEventListener('load', function() {
                jqueryLoaded = true;
                console.log('jquery loaded');
                if (underscoreLoaded) {
                  go();
                }
              }, false);
              var underscore = document.createElement("script");
              underscore.setAttribute("src", statsServer + "/assets/js/underscore-min.js");
              underscore.addEventListener('load', function() {
                underscoreLoaded = true;
                console.log('underscore loaded');
                if (jqueryLoaded) {
                  go();
                }
              }, false);
              function go() {
                var script = document.createElement("script");
                script.textContent = "(" + callback.toString() + ")();";
                document.body.appendChild(script);
              }
              document.body.appendChild(jquery);
              document.body.appendChild(underscore);
            }

            // the guts of this userscript
            function main() {
                var statsServer = "http://heatmap.ophan.co.uk";

                // add our stylesheet
                $('head').append('<link rel="stylesheet" href="'+statsServer+'/assets/stylesheets/gm-heatmap.css" type="text/css" />');
                $('body').attr('style', 'background-color: white'); // FIXME

                function makeHash(s) {
                    var hash = 0;
                    for (i = 0; i < s.length; i++) {
                        hash = ((hash<<5)-hash)+s.charCodeAt(i);
                        hash = hash & hash; // Convert to 32bit integer
                    }
                    return hash;
                }

                function updateStats() {
                    console.log("Updating stats");
                    var url = ['http:', '//', 'm.guardian.co.uk', '/'].join('');
                    
                    console.log('getting stats for: ' + url);
                    // http://heatmap.ophan.co.uk/api/linkCounts?page=http://www.guardian.co.uk/&callback=jQuery171015593841462396085_1358699127963&_=1358699128016
                    
                    $.getJSON(statsServer+"/api/linkCounts?page="+url+"&callback=?", function(result) {

                        var validThingys = _.chain(result)
                            .map(function(item) { item.node = $(item.sel); return item; })
                            .filter(function(item){ return item.node && item.node.html() && (makeHash(item.node.html()) == item.hash) })
                            .sortBy(function(item){ return item.count })
                            .value();

                        var validThingys = result;
                        var size = validThingys.length;

                        console.log('stats results: ' + size);

                        var finalResult = _(validThingys).map(function(item, index) {
                            item.weight = ((index + 1.0) / size);
                            item.chartPosition = size - index;
                            return item;
                        });

                        $('[old-background]').each(function(index, item){
                            var oldBackground = $(item).attr('old-background')
                            if (oldBackground == 'no-background') {
                                $(item).css('background', '');
                            } else {
                                $(item).css('background', oldBackground);
                            }
                        });

                        $(".greasy-heatmap").remove();

                        _(finalResult).each(function(item){
                            var redness = Math.floor((1.0 - item.weight) * 255);
                            var rgb = 'rgb(255,' + redness + ',' + redness + ')';
                            var titleText = item.count + " hit" + (item.count == 1 ? "" : "s");
                            var oldBackground = item.node.css('background') ? item.node.css('background') : "no-background";
                            item.node.css('background', rgb);
                            item.node.before('<span class="greasy-heatmap" style="background: ' + rgb + '" title="' + titleText + '">' +
                                item.chartPosition + '</span>');
                            item.node.attr('old-background', oldBackground);
                            console.log(item);
                        });

                    });
            
                    //window.setTimeout(updateStats, 5000);
                }

                updateStats();
            }

            // load libraries and execute the main function
            
            console.log(c);
            addLibraries(main);

        }, c);

});

