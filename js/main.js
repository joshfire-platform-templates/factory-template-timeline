var f = Joshfire.factory;
var params = f.config.template.options.params;
var dataEvents = f.getDataSource("events");

/* utility function to load script async */
function loadScript(src, callback)
{
  var s, r;
  r = false;
  s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = src;
  s.onload = s.onreadystatechange = function() {
    if ( !r && (!this.readyState || this.readyState == 'complete') )
    {
      r = true;
      callback();
    }
  };
  document.body.appendChild(s);
}

var event_list = [], timeline_data, timeline_config;
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
      else if (entry["@type"] == "Article/Status" && entry.hasOwnProperty("author") &&
          entry.author[0] !== undefined) {
        if (entry.author[0].image !== undefined && entry.author[0].image.contentURL !== undefined) {
          eventItem.asset = {};
          eventItem.asset.media = entry.author[0].image.contentURL;
          if (entry.author[0]["foaf:nick"] !== undefined) {
            eventItem.asset.caption = "<a href='" + entry.author[0].url + "'>" +
              entry.author[0]["foaf:nick"] + "</a>";
          }
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
      startDate: params.startDate || "1988,01,01",
      text: params.description || "Beautiful timelines",
      "date": event_list
    }
  };

  console.log(timeline_data);

  /* initial timeline config */
  timeline_config = {
    width: "100%",
    height: "100%",
    source: timeline_data,
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

  loadScript("js/timeline-embed.js", function(){});

});
