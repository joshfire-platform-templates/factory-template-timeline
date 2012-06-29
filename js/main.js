var f = Joshfire.factory;
var params = f.config.template.options.params;
var dataEvents = f.getDataSource("events");

var googleUrl, timeline_data, timeline_config;

var init_timeline = function(){
  /* initial timeline config */
  timeline_config = {
    width: "100%",
    height: "100%",
    source: googleUrl || timeline_data,
    font: params.font || "Bevan-PotanoSans",
    start_at_end: params.start_at_end || false,
    //hash_bookmark: true,            //OPTIONAL
    css:  'css/timeline.css',
    js:   'js/timeline-min.js'
  };

  /* depending on the template params, extend this config */
  if(params.start_at_end !== undefined){
    _.extend(timeline_config, {start_at_end: true});
  }
  if(params.font !== undefined){
    _.extend(timeline_config, {font: params.font});
  }
  if(params.lang !== undefined){
    _.extend(timeline_config, {lang: params.lang});
  }

  $.getScript("js/timeline-embed.js", function(){

    if(params.custom_scrollbar){
      $.getScript("js/jquery.mousewheel.js", function(){
        $.getScript("js/jquery.jscrollpane.min.js", function(){
          loadScrollbars();
        });
      });
    }

  });
};

if (dataEvents.config.db == "google" && 
    dataEvents.config.col == "spreadsheets" && 
    dataEvents.config.query.filter.docid !== undefined) 
{
  /* if source is google spreadsheet, parse doc to get right url, to use TimelineJS google code
     This part will be removed when standard data mapping will be completely updated */
  var googleKey;
  var docid = dataEvents.config.query.filter.docid;
  var googleKeyAloneRegex = /^[0-9A-Za-z_]*$/;
  if (googleKeyAloneRegex.test(docid)){
    googleKey = docid;
  } else {
    var googleKeyUrlRegex = /key=([0-9A-Za-z_]*)(&|$)/;
    var res = googleKeyUrlRegex.exec(docid);
    if(res[1] !== undefined && res[1] !== ""){
      googleKey = res[1];
    }
  }
  googleUrl = 
    "https://docs.google.com/spreadsheet/pub?key=" + 
    googleKey +
    "&output=html";
  init_timeline();
}
else {
  var event_list = [];
  /* parse datasource entries into TimelineJS compatible event_list */
  dataEvents.find({}, function(err, data){
    _.map(data.entries, function (entry, idx) {

      //startDate is either startDate or datePublished
      var eventItem = {headline: entry.name};
      if(entry.hasOwnProperty("startDate")){
        eventItem.startDate = entry.startDate;
      }
      else if(entry.hasOwnProperty("datePublished")){
        eventItem.startDate = entry.datePublished;
      }
      else if(entry.hasOwnProperty("uploadDate")){
        eventItem.startDate = entry.uploadDate;
      }
      else if(entry.hasOwnProperty("dateModified")){
        eventItem.startDate = entry.dateModified;
      }

      //don't go any further if no date could be set
      if(eventItem.startDate !== undefined){

        //BlogPosting

        //Article. Includes datasources coming from Google preformatted spreadsheets
        if (entry["@type"] == "Article" && entry.hasOwnProperty("associatedMedia") ) {
            eventItem.asset = {};
            if(entry.associatedMedia.hasOwnProperty("url")){
              eventItem.asset.media = entry.associatedMedia.url;
            }
            if(entry.associatedMedia.hasOwnProperty("name")){
              eventItem.asset.caption = entry.associatedMedia.name;
            }
            if(entry.associatedMedia.hasOwnProperty("author") && 
              entry.associatedMedia.author.hasOwnProperty("name"))
            {
              eventItem.asset.credit = entry.associatedMedia.author.name;
            }
        }

        //tweets and other statuses
        else if (entry["@type"] == "Article/Status") {
          //console.log(entry);
          eventItem.text = "";
          eventItem.asset = {};
          eventItem.asset.media = entry.url;
        }

        //Event
        if (entry["@type"] == "Event" ) {
          if(entry.hasOwnProperty("startDate")){
            eventItem.startDate = entry.startDate;
          }
        }

        //videos
        else if (entry["@type"] == "VideoObject") {
          eventItem.asset = {};
          eventItem.asset.media = entry.url;
          if(entry.hasOwnProperty("author") && entry.author.name !== undefined){
            eventItem.asset.credit = entry.author.name;
          }
        }

        //if possible, fill fields that are still empty
        if(entry.hasOwnProperty("endDate")){
          eventItem.endDate = entry.endDate;
        }

        if (eventItem.asset === undefined && entry.hasOwnProperty("image") &&
            entry.image.contentURL !== undefined) {
          eventItem.asset = {media: entry.image.contentURL};
        }      

        if (eventItem.text === undefined && entry.hasOwnProperty("description")) {
          eventItem.text = entry.description;
        }

        event_list.push(eventItem);
      }
    });
    
    /* include the formatted event_list into a TimelineJS structure */

    timeline_data = 
    {
      timeline : {
        headline: params.title || "Joshfire Timeline",
        type: "default",
        text: params.description || "",
        "date": event_list
      }
    };
  });

  console.log(timeline_data);
  init_timeline();
}


var emptyIterations = 0;
var loadScrollbars = function(){
  var newSliders = $(".slider-item:not(.custom-scrollbar)")
    .filter(function(){ return this.style.display == 'block'; });
  if (newSliders.length > 0) {
    newSliders.jScrollPane();
    newSliders.addClass("custom-scrollbar");
    emptyIterations = 0;
  }
  else {
    emptyIterations ++;
  }
  if(emptyIterations < 100)
    window.setTimeout(loadScrollbars, 2000);
};