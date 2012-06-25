var f = Joshfire.factory;
var params = f.config.template.options.params;
var dataEvents = f.getDataSource("events");

/* if source is google spreadsheet, parse doc to get right url */
var googleUrl, googleKey;
if (dataEvents.config.db == "google" && 
    dataEvents.config.col == "spreadsheets" && 
    dataEvents.config.query.filter.docid !== undefined) 
{
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
}

/* initial timeline config */
var timeline_config = {
  width: "100%",
  height: "100%",
  source: googleUrl,
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