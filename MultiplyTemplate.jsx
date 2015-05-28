/*
      __|   \   |   __|  \| |
     |     /_\  |   _|   \  |
    \___|_/  _\___|___|_| \_|
                 2015-05-28
*/
#target photoshop
function copy_style(src){
    this.blendMode = src.blendMode;
    if(src.fillOpacity<100)this.fillOpacity = src.fillOpacity;
    if(src.opacity<100)this.opacity = src.opacity;
    this.pixelsLocked = src.pixelsLocked;
    this.positionLocked = src.positionLocked;
    this.transparentPixelsLocked = src.transparentPixelsLocked;
    this.visible = src.visible;
    this.move(src.parent, ElementPlacement.INSIDE);
    this.move(src, ElementPlacement.PLACEBEFORE);
    for(i in src.linkedLayers)this.link(linkedLayers[i]);
    this.name = src.name;
}
LayerContainer = function(con){
//  provide Group/Layer searching
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

function $D(name){
/*  Document Selecting
    $D("Untitled-1.psd") return opened document "Unitiled-1.psd". 
    If failed, try open it in the directory of the current active document, 
    or directory specified in the argument: "dir1/dir2/Untitled-2.psd", "../Untitled-2.psd". 
    The path is relative to the directory of the current active document. 
    If file not exist, create new document with the directory/filename provided, 
    $D() return the current active document
*/
    if(arguments.length<1 ||!name)return app.activeDocument;
    var res;
    var docname = name.replace(/\/$/,"");
    try{
        res =  app.documents.getByName(docname);
    }catch(err){
    	try{
    	    res = app.open(File($D().path +"/"+ name));
    	}catch(err){
    	    res = app.documents.add(null,null,null,docname);
    	    }
    }
    app.activeDocument = res;
    return res;
}

function $L(name){
/*  Layer Selecting. 
    @name is a path like "Untitled-1.psd/Group 1/Layer 1". 
    If group name specified, only find in that group and its sub groups. 
    If file name omitted "/Group 2/Layer 1" find in active document, leading "/"connot be omitted. 
    If group name omitted "Untitled-1.psd/Layer 1", find in the file specified
    "/Layer 1" means search in the document, but not in any groups. 
    If only a layer name "Layer 1" provided, find in the active document. 
*/
    var res;
    var argv_raw = name.split("/");
    var argv=new Array();
	while(argv_raw.length>0){
	    var id_v;
		if((id_v=argv_raw.shift())==""){
			argv[argv.length-1]+="/"+argv_raw.shift();
		}else argv[argv.length]=id_v;
	}
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
/*  Text Layer Selection. 
    Not a text layer, convert it. 
    Layer with provided name not found, create one with the name. 
    @name not provided, create one with default name.
*/
    var res;
    if(arguments.length<1 ||!name){
        res = app.activeDocument.artLayers.add();
        name = res.name
        res.kind = LayerKind.TEXT;
        res.name = name;
        return res.textItem;
    }
    if((res = $L(name)).kind != LayerKind.TEXT)res.kind = LayerKind.TEXT;
    return res.textItem;
}

function CSVToArray(strData){
    strDelimiter = ",";
    var objPattern = /(?:"([^"]*(?:""[^"]*)*)"|([^"\,\r\n]*))(\,|\r?\n|\r)/gi;
    var arrData = [];
    arrData.push([]);
    var arrMatches = null;
    while(arrMatches = objPattern.exec(strData)){
        var strMatchedDelimiter = arrMatches[3];
        if(arrMatches[1])var strMatchedValue = arrMatches[1].replace(new RegExp( "\"\"", "g" ),"\"");
        else var strMatchedValue = arrMatches[2];
        arrData[arrData.length-1].push(strMatchedValue);
        if(strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter))arrData.push([]);
    }
    if(arrData[arrData.length-1].length==0)arrData.pop();
    return arrData;
}//support , "

Sheet = function(path){
    var fcsv;
    if(arguments.length<1){
        fcsv = File.openDialog("Open CSV file: ");
    }else{
        fcsv = File(path);
    }
    try {fcsv.open("r");}catch(err){}
    this.csv = fcsv.read();//read CSV
    fcsv.close();
    list_arr = CSVToArray(this.csv);
    //list_arr[row++][col++]
    for(var i=1;i<list_arr[0].length;i++){
        if(list_arr[0][i]==""&&list_arr[0][i-1]!="")list_arr[0][i]=list_arr[0][i-1];
    }//add omitted layer name. ,,Layer 1,,,Layer 2 = ,,Layer 1,Layer 1,Layer 1,Layer 2
    for(var i=1;i<list_arr[0].length;i++){
        if(list_arr[0][i]==list_arr[0][i-1]){
            list_arr[0][i]="";
            for(var j=0;j<list_arr.length; j++){
                list_arr[j][i-1] += list_arr[j][i];
                list_arr[j] = list_arr[j].slice(0,i).concat(list_arr[j].slice(i+1));
            }
        }
    }
    /*Concat values with a same layer name: 
      Layer 1,Layer 1,Layer 2,,
      abc,def,ghi,jkl
      =
      Layer 1,Layer 2
      abcdef,ghijkl
    */
    this.keys = list_arr.shift();//first line as layer names
    this.keys.shift();//first column as file name
    this.csv_array = list_arr;
    this.data = list_arr;
    this.getline = function(){
        return this.format(this.data.shift());
    };
    this.format = function(val){return val;};//writable
};

TempletDoc = function(docref){
    this.doc = docref;
    this.path = docref.path;
    this.filename = docref.name;
    this.foldername = "";
    this.save = function(){
        Folder(this.path + this.foldername).create();
        var f = File(this.path+"/"+this.foldername + this.filename+".psd");
        this.doc.saveAs(f, PhotoshopSaveOptions(), true);
    }
    this.data = [];
    this.keys = [];
    this.selection_reg = [[]];//cache
    this.replace = function(){
        for(var i in this.keys){
            var dst = $L(this.doc.name+"/"+this.keys[i]);
            if(dst.kind==LayerKind.TEXT)dst.textItem.contents = this.data[i];
            //For text layer
            else if(dst.kind==LayerKind.NORMAL){
            //For normal layer
                var src = $D(this.data[i]);
                src.selection.select([[0,0],[0,src.height],[src.width,src.height],[src.width,0]]);
                //select all on src
                var copy_merged_aval = true;
                if(src.artLayers.length<=1)copy_merged_aval = false;
                //CopyMerged fail if contain only 1 layer
                src.selection.copy(copy_merged_aval);
                app.activeDocument = this.doc;
                this.doc.activeLayer = dst;
                if(!this.selection_reg[i]){
                    var dst_reg_nw = dst.bounds.slice(0,2);
                    var dst_reg_se = dst.bounds.slice(2,4);
                    var dst_reg_sw = [dst_reg_nw[0], dst_reg_se[1]];
                    var dst_reg_ne = [dst_reg_se[0], dst_reg_nw[1]];
                    this.selection_reg[i] = [dst_reg_nw,dst_reg_sw,dst_reg_se,dst_reg_ne];
                }//cache selection on dist
                this.doc.selection.select(this.selection_reg[i]);
                this.doc.activeLayer = dst;
                src_in_dst = this.doc.paste(true);//PasteIntoSelection: create new layer and layer mask
                copy_style.call(src_in_dst, dst);//move new layer and copy propertiey
                dst.remove();
                src.close();
            }
        }
    }
};

app.bringToFront();
//main procudure start
var list = new Sheet();
//init data
var line;
//Current data line
var page = new TempletDoc($D());
//Document as template is the current active one
page.keys = list.keys;
//read layer names
while(line = list.getline()){
    page.data = line;
    //read layer contents
    page.filename = page.data.shift();//first column as file name
    page.replace();
    page.save();
}
//finished