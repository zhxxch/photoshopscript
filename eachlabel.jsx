LayerContainer = function(con){
    if(con.typename!="Document" && con.typename!="LayerSet")throw "Type error";
    this.container = con;
    this._getLayerSet = function(path){
        var res = this.container;
        if(path.length == 0)return this;
        for(var i in path){
            try{
                res = res.layerSets.getByName(path[i]);
            }catch(err){
                res = res.layerSets.add();
                res.name = path[i];
            }
        }
        return LayerContainer(res);
    };
    this._getLayer = function(name){
        var res;
        try{
            res = this.container.artLayers.getByName(name);
        }catch(err){
            return false;
        }
        return res;
    }
    this._searchLayer = function(name){
        var res;
        if(name == ""){
            if(this.container.typename == "Document")return this.container.activeLayer;
            else return this.container;
        }
        if((res = this._getLayer(name))!=false)return res;
        else{
            if(this.container.layerSets.length > 0){
                for(var i = 0; i<this.container.layerSets.length; i++){
                    sub_container = new LayerContainer(this.container.layerSets[i])
                        if((res = this._searchLayer.call(sub_container, name))!=false)return res;
                }
            }else return false;
        }
    }
}
/*
function _getLayerSet(container, path){
    var res = container;
    if(path.length == 0)return res;
    for(var i in path){
        try{
            res = res.layerSets.getByName(path[i]);
        }catch(err){
            res = res.layerSets.add();
            res.name = path[i];
        }
    }
    return res;
}

function _getLayer(container, name){
    var res;
    try{
        res = container.artLayers.getByName(name);
    }catch(err){
        return false;
    }
    return res;
}

function _searchLayer(container, name){
    //container: Document or LayerSet
    var res;
    if(name == ""){
        if(container.typename == "Document")return container.activeLayer;
        else return container;
    }
    if((res = _getLayer(container, name))!=false)return res;
    else{
        if(container.layerSets.length > 0){
            for(var i = 0; i<container.layerSets.length; i++){
                if((res = _searchLayer(container.layerSets[i], name))!=false)return res;
            }
        }else return false;
    }
}
*/
function $D(name){
    if(arguments.length<1 ||!name)return app.activeDocument;
    var res;
    var docname = name.replace(/\/$/,"");
    try{
        res =  app.documents.getByName(docname);
    }catch(err){
        res = app.documents.add(null,null,null,docname);
    }
    return res;
}

function $L(name){
    var res;
    var argv = name.split("/");
    var layer_name = argv.pop();
    var doc_name = argv.shift();
    var layerset_path = argv;
    var l_con = new LayerContainer($D(doc_name));
    l_con = l_con._getLayerSet(layerset_path);
    try{
        res = l_con._searchLayer(layer_name);
    }catch(err){
        res = l_con.container.artLayers.add();
        res.name = layer_name;
    }
    return res;
}
function $T(name){
    var res;
    if((res = $L(name)).kind != LayerKind.TEXT)res.kind = LayerKind.TEXT;
    return res.textItem;
}

function CSVToArray( strData, strDelimiter ) {
    strDelimiter = (strDelimiter || ",");
    var objPattern = new RegExp(("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +"([^\"\\" + strDelimiter + "\\r\\n]*))"),"gi");
    var arrData = [[]];
    var arrMatches = null;
    while (arrMatches = objPattern.exec( strData )) {
        var strMatchedDelimiter = arrMatches[ 1 ];
        if (
                strMatchedDelimiter.length &&
                (strMatchedDelimiter != strDelimiter)
           )arrData.push( [] );
        if (arrMatches[ 2 ]) {
            var strMatchedValue = arrMatches[ 2 ].replace(new RegExp( "\"\"", "g" ),"\"");
        } else {
            var strMatchedValue = arrMatches[ 3 ];
        }
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }
    return( arrData );
}

Sheet = function(path){
    var fcsv;
    if(arguments.length<1){
        fcsv = File.openDialog("Open CSV file: ");
    }else{
        fcsv = File(path);
    }
    fcsv.open("r");
    this.csv = fcsv.read();//read CSV
    fcsv.close();
    list_arr = CSVToArray(this.csv, ",");
    this.keys = list_arr.shift();
    this.csv_array = list_arr;
    this.data = list_arr;
    this.getline = function(){
        return this.format(this.data.shift());
    };
    this.format = function(val){return val;};
};

TempletDoc = function(docref){
    this.doc = docref;
    this.path = docref.path;
    this.filename = docref.name;
    this.foldername = "";
    this.save = function(){
//        alert(this.path+this.foldername+this.filename);
        Folder(this.path + this.foldername).create();
        var f = File(this.path+"/"+this.foldername + this.filename+".psd");
        this.doc.saveAs(f, PhotoshopSaveOptions(), true);
    }
    this.data = [];
    this.keys = [];
    this.replace = function(){
        for(var i in this.keys){
            $T(this.doc.name+"/"+this.keys[i]).contents = this.data[i];

        }
    }
}
var list = new Sheet();
var line;
while(line = list.getline()){
    var page = new TempletDoc($D());
    page.keys = list.keys;
    page.data = line;
    page.filename = line[0];
    page.foldername = "/ic_psd/";
    page.replace();
    page.save();
}
//alert($L("Untitled-3.psd/Layer 1").visible);
//alert($L("Untitled-3.psd/Group 1/Layer 1").visible);
