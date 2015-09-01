/*
 *  Copyright (c) 2015 X. ZHANG <201560039.uibe.edu.cn>
 *
 *       __ |  \   /   __|
 *         /     /    |   
 *       ___|  _/ _\ \___|
 */
#target photoshop
app.bringToFront();
var strtRulerUnits = app.preferences.rulerUnits;
app.preferences.rulerUnits = Units.MM;

function A4sigma(w, h){
    //w, h(mm)
    //export count of papers.
    var hlx = Math.ceil( w/297 );
    var hly = Math.ceil( h/210 );
    var vlx = Math.ceil( w/210 );
    var vly = Math.ceil( h/297 ); //sum of used papers.
    var hsigma = hlx * hly;
    var vsigma = vlx * vly;
    var h_margin_di = ((w%297) - (h%210))^2;
    var v_margin_di = ((w%210) - (h%297))^2; //more different margin prefered.

    return [hsigma, vsigma, h_margin_di, v_margin_di, hlx, vlx, hly, vly];
}
function A4V(sigma){
    //whether using A4 paper horizontally or vertically.
    if(sigma[0] < sigma[1])return false;
    if(sigma[0] = sigma[1]){
        if(sigma[2] < sigma[3])return false;
        else return true;
    }else return true;
}
function A4layout(sigma){
    layout = new Array();
    if(A4V(sigma)){
        layout[0] = sigma[5];
        layout[1] = sigma[7];
    }else{
        layout[0] = sigma[4];
        layout[1] = sigma[6];
    }
    return layout;
}
var lrgimg = app.activeDocument; //larger image.
var lrgimg_height = lrgimg.height;
var lrgimg_width = lrgimg.width; //px size of larger image.
lrgimg_height.baseUnit = UnitValue(1.0/lrgimg.resolution, 'in');
lrgimg_width.baseUnit = UnitValue(1.0/lrgimg.resolution, 'in');
var A4w = new UnitValue(210, 'mm');
var A4h = new UnitValue(297, 'mm');
A4w.baseUnit = lrgimg_width.baseUnit;
A4h.baseUnit = lrgimg_height.baseUnit;
var A4papers = A4sigma(lrgimg_width.value, lrgimg_height.value);
var lrgimg_layout = A4layout(A4papers);
if(lrgimg_layout=="1,1"){
    alert("Document within A4 size!!");
}else{
    if(A4V(A4papers)){
        var A4img = app.documents.add(A4w, A4h, lrgimg.resolution, 'A4BLOCK'); 
        var selection_w = A4w.as('px');
        var selection_h = A4h.as('px');
    }else{
        var A4img = app.documents.add(A4h, A4w, lrgimg.resolution, 'A4BLOCK');
        var selection_w = A4h.as('px');
        var selection_h = A4w.as('px');
    } //init new document, sizeof selection area.
    var regionSet = new Array();
    var labelSet = new Array();
    var areaSet = new Array();
    for(var y = lrgimg_layout[1] - 1; y >= 0; y--){
        for(var x = 0; x < lrgimg_layout[0]; x++){
            var NWx = x * selection_w;
            var NWy = y * selection_h;
            var SEx = (x+1) * selection_w;
            var SEy = (y+1) * selection_h;
            var xoverflow = 0;
            var yoverflow = 0;
            if(SEx > lrgimg_width.as('px'))xoverflow = 1;
            if(SEy > lrgimg_height)yoverflow = 1;
            labelSet.push(x+'+'+ (lrgimg_layout[1]-1-y) +'i');

            regionSet.push([[NWx, NWy], [SEx, NWy], [SEx, SEy], [NWx, SEy]]);
            areaSet.push([selection_w-xoverflow*(SEx-lrgimg_width.as('px')), selection_h-yoverflow*(SEy-lrgimg_height.as('px'))]);
        }
    }
    for(var n in labelSet){
        app.activeDocument = lrgimg;
        lrgimg.selection.select(regionSet[n]);
        lrgimg.selection.copy(true);
        lrgimg.selection.deselect();
        app.activeDocument = A4img;
        A4img.selection.select([[0,0],[0,areaSet[n][1]],[areaSet[n][0],areaSet[n][1]],[areaSet[n][0],0]]);
        A4img.paste(true);
        A4img.selection.deselect();
        A4img.activeLayer.name = labelSet[n];
    }
}
app.preferences.rulerUnits = strtRulerUnits;
