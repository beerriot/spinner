function getPref(Key) {
    if (window.widget) {
        return widget.preferenceForKey(Key)
    } else if (window.localStorage) {
        return localStorage.getItem(Key);
    }
}

function setPref(Key, Val) {
    if (window.widget) {
        widget.setPreferenceForKey(Val, Key);
    } else if (window.localStorage) {
        localStorage.setItem(Key, Val);
    }
}

var nextClass = "flipped"; //workaround for broken -webkit-backface-visibility
var elts = {
    card:null,
    front:null,
    back:null,
    divnames:null,
    savename:null,
    saveddivs:null,
    done:null,
    save:null,
    wedgelabel:null,
    showabout:null,
    closeabout:null,
    about:null
};
var ctx = {
    boardcanvas:null,
    spinnercanvas:null
};

function finddom() {
    for(e in elts)
        elts[e] = document.getElementById(e);
    for(c in ctx)
        ctx[c] = document.getElementById(c).getContext("2d");
}

function forgetdom() {
    for(e in elts)
        elts[e] = null;
    for(c in ctx)
        ctx[c] = null;
}

function setup() {
    finddom();

    if (window.widget)
        widgetSetup();
    else
        webappSetup();

    selectLastWedgeGroup = true;
    if (window.location.hash &&
        window.location.hash.indexOf("#wedgeNames:") == 0) {
        selectLastWedgeGroup = false;
        elts.divnames.value = window.location.hash.substring(12);
    } else {
        //load most recently used wedge names
        elts.divnames.value = getPref("wedgeNames") || "No,Yes";
    }
    setupWedges(elts.divnames.value);

    loadWedgeGroupNames();

    if (selectLastWedgeGroup) {
        var wedgeGroupString = getPref("selectedWedgeGroup");

        if(wedgeGroupString) {
            elts.savename.value = wedgeGroupString;
            for(i = 0; i < elts.saveddivs.length; i++) {
	        if(elts.saveddivs.options[i].value == wedgeGroupString) {
	            elts.saveddivs.selectedIndex = i;
	        }
            }

            setSavedState();
        }
    } else {
        elts.saveddivs.selectedIndex = -1;
    }

    elts.done.style.left = 67;
    elts.done.onclick = hideBack;

    elts.save.onclick = saveWedgeGroup;

    elts.showabout.onclick = function() {
        elts.about.style.top="10px";
    }
    elts.closeabout.onclick = function() {
        elts.about.style.top="-282px";
    }
}

function widgetSetup() {
    document.body.className = "widget";
    document.getElementById("boardcanvas").setAttribute("width","200");
    document.getElementById("boardcanvas").setAttribute("height","200");
    document.getElementById("spinnercanvas").setAttribute("width","200");
    document.getElementById("spinnercanvas").setAttribute("height","200");
    ctx.boardcanvas.scale(2/3, 2/3);
    ctx.spinnercanvas.scale(2/3, 2/3);
    
    elts.flipbutton = document.getElementById("flipbutton");
    elts.flipbutton.style.visibility = "hidden";
    var mto;
    document.getElementById("content").addEventListener(
        'mouseover',
        function() {
            if (mto) { clearTimeout(mto); mto = null; }
            elts.flipbutton.style.visibility = "visible";
        });
    document.getElementById("content").addEventListener(
        'mouseout',
        function() {
            mto = setTimeout(function() {
                elts.flipbutton.style.visibility = "hidden";
            }, 500);
        });

    openUrl = function(e) {
        widget.openURL(this.getAttribute('href'));
        e.preventDefault();
    }
    document.getElementById("bryan").addEventListener(
        'click', openUrl);
    document.getElementById("homepage").addEventListener(
        'click', openUrl);
}

function webappSetup() {
    elts.card.addEventListener(
        'webkitTransitionEnd',
        function(ev) {
            if (nextClass == "flipped") {
                elts.front.style.visibility="hidden";
                elts.back.style.visibility="visible";
            }
            else {
                elts.front.style.visibility="visible";
                elts.back.style.visibility="hidden";
            }
            elts.card.className=nextClass;
        });
}

// Back side code

function divNameChange() {
    setTimeout('setSavedState();', 0);
}

function setSavedState() {
    var savedName = elts.saveddivs.options[elts.saveddivs.selectedIndex].value;

    if(elts.divnames.value == "") {
        elts.save.className = "button disabled";
    }
    else if(elts.divnames.value == getPref(savedName)) {
        elts.divnames.style.background = "#FFFFFF";
        elts.save.className = "button disabled";
    }
    else {
        elts.save.className = "button";
    }
}

function saveWedgeGroup() {
    var savedSelect = elts.saveddivs;
    var savedIndex = 0;

    var wedgeGroupName = elts.savename.value;
    var wedgeString = elts.divnames.value;
    if(wedgeGroupName.length != 0 && wedgeGroupName != "Yes/No") {
        if(wedgeString.length == 0) {
	    //if user has given no div names, then he wants to remove the save
	    setPref(wedgeGroupName, null);

	    var wedgeGroupNames = "Yes/No";
	    for(i = 1; i < savedSelect.length; i++) {
	        if(wedgeGroupName != savedSelect.options[i].value)
	            wedgeGroupNames += ","+savedSelect.options[i].value;
	    }

	    setPref("wedgeGroupNames", wedgeGroupNames);

	    savedIndex = 0;
        }
        else {
	    //save the wedge names under the save name
	    var testPref = getPref(wedgeGroupName);
	    if(testPref && testPref.length > 0) {
	        //if a save is already under this name, just overwrite it
	        setPref(wedgeGroupName, wedgeString);
                for (savedIndex = 1; savedIndex < savedSelect.length; savedIndex++)
                    if (wedgeGroupName == savedSelect.options[savedIndex].value)
                        break;
	    }
	    else {
	        //otherwise, create the saved entry
	        setPref(wedgeGroupName, wedgeString);

	        //save new wedge group names string
	        var newAdded = false;
	        var wedgeGroupNames = "Yes/No";
	        for(i = 1; i < savedSelect.length; i++) {
	            if(alphabetOrder(wedgeGroupName, savedSelect.options[i].value)) {
	                wedgeGroupNames += ","+wedgeGroupName;
	                savedIndex = i;
	                for(j = i; j < savedSelect.length; j++) {
		            wedgeGroupNames += ","+savedSelect.options[j].value;
	                }
	                newAdded = true;
	                break;
	            }
	            else {
	                wedgeGroupNames += ","+savedSelect.options[i].value;
	            }
	        }
	        if(!newAdded) {
	            savedIndex = savedSelect.length;
	            wedgeGroupNames += ","+wedgeGroupName;
	        }

	        setPref("wedgeGroupNames", wedgeGroupNames);
	    }
        }      
        //reset group dropdown
        loadWedgeGroupNames();
        
        //select just-saved
        savedSelect.selectedIndex = savedIndex;

        loadWedgeGroup();
    }
}

function alphabetOrder(a, b) {
    //return true if a is before b alphabetically 

    for(letter = 0; letter < a.length; letter++) {
        if(letter >= b.length) return false;

        if(a[letter] < b[letter]) return true;

        if(a[letter] > b[letter]) return false;
    }

    return true;
}

function loadWedgeGroupNames() {
    var savedSelect = elts.saveddivs;
    
    //clear list
    while(savedSelect.length != 0) {
        savedSelect.options[0] = null;
    }

    //load saved wedge groups
    var wedgeGroupNames = getPref("wedgeGroupNames");
    if(wedgeGroupNames) {
        //decode
        var groupNames = wedgeGroupNames.split(",");
        for(i = 0; i < groupNames.length; i++) {
	    savedSelect.options[savedSelect.length] = new Option(groupNames[i], groupNames[i], false, false);
        }
    }
    else {
        savedSelect.options[0] = new Option("Yes/No", "Yes/No", false, false);
    }
}

function loadWedgeGroup() {
    var selectedGroup = elts.saveddivs.options[elts.saveddivs.selectedIndex].value;

    elts.savename.value = selectedGroup;
    
    var groupWedgeNames = null;
    if(selectedGroup == "Yes/No") {
        groupWedgeNames = "No,Yes";
    }
    else {
        groupWedgeNames = getPref(selectedGroup);
    }

    elts.divnames.value = groupWedgeNames;

    setSavedState();

    setPref("selectedWedgeGroup", selectedGroup);
}


//Front Side

var colorsRed = new Array(255, 0, 0, 255, 0, 255);
var colorsGreen = new Array(0, 255, 0, 255, 255, 0);
var colorsBlue = new Array(0, 0, 255, 0, 255, 255);

var wedgeNames = new Array( "No", "Yes" );
var wedgeCount = 2;

function setWedgeColor(index, red, green, blue) {
    colorsRed[index] = red;
    colorsGreen[index] = green;
    colorsBlue[index] = blue;
}

function setupWedges(wedgeNameString) {
    var newWedgeNames = wedgeNameString.split(',');
    
    if(newWedgeNames.length == 0) {
        wedgeCount = 2;
        wedgeNames[0] = "No";
        setWedgeColor(0, 255, 0, 0);
        wedgeNames[1] = "Yes";
        setWedgeColor(1, 0, 255, 0);
    }
    if(newWedgeNames.length == 1) {
        if(newWedgeNames[0] == "") {
            wedgeNames[0] = "No";
            wedgeNames[1] = "Yes";
        }
        else {
            wedgeNames[0] = "Not "+newWedgeNames[0];
            wedgeNames[1] = newWedgeNames[0];
        }
        wedgeCount = 2;
        setWedgeColor(0, 255, 0, 0);
        setWedgeColor(1, 0, 255, 0);
    }
    else if(newWedgeNames.length == 2) {
        wedgeNames[0] = newWedgeNames[0];
        wedgeNames[1] = newWedgeNames[1];

        wedgeCount = 2;
        setWedgeColor(0, 255, 0, 0);
        setWedgeColor(1, 0, 255, 0);
    }
    else {
        wedgeCount = newWedgeNames.length;
        for(i = 0; i < newWedgeNames.length; i++) {
            wedgeNames[i] = newWedgeNames[i];
        }

        doRainbowColoring(wedgeCount);
    }
}

function doRainbowColoring(wedgeCount) {
    var pio3 = 3.14159/3;
    var m = 255/(3.14159/3);
    var wedgeArc = (2*3.14159)/wedgeCount;

    for(i = 0; i < wedgeCount; i++) {
        var angle = i*wedgeArc;
        //angle is always positive
        if(angle < pio3) {
            red = 255;
            green = Math.ceil(m*angle);
            blue = 0;
        }
        else if(angle < 2*pio3) {
            red = Math.ceil(m*(2*pio3-angle));
            green = 255;
            blue = 0;
        }
        else if(angle < 3.14159) {
            red = 0;
            green = 255;
            blue = Math.ceil(m*(angle-2*pio3));
        }
        else if(angle < 4*pio3) {
            red = 0;
            green = Math.ceil(m*(4*pio3-angle));
            blue = 255;
        }
        else if(angle < 5*pio3) {
            red = Math.ceil(m*(angle-4*pio3));
            green = 0;
            blue = 255;
        }
        else {
            red = 255;
            green = 0;
            blue = Math.ceil(m*(2*3.14159-angle));
        }
        setWedgeColor(i, red, green, blue);
    }
}

function drawBoard(incontext) {
    var context = incontext;
    if(context == null)
        context = ctx.boardcanvas;

    context.save();
    //context.scale(.18966, .18966);

    context.clearRect(0, 0, 300, 300);

    //setup color, style, etc.
    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.fillStyle = "#00FFFF";
    
    for(i = 0; i < wedgeCount; i++) {
        drawWedge(i, context);
    }

    drawHighlight(context, "rgba(255, 255, 255, 0.50)", -3.14159*3/4);
    drawHighlight(context, "rgba(0, 0, 0, 0.25)", 3.14159/4);

    context.restore();
}

var selectedWedge = -1;
function drawWedge(wedgeIndex, context) {
    context.save();
    if(selectedWedge >= 0 && selectedWedge != wedgeIndex) {
        context.fillStyle = "rgba("+colorsRed[wedgeIndex]+", "+colorsGreen[wedgeIndex]+", "+colorsBlue[wedgeIndex]+", 0.25)";
        context.strokeStyle = "rgba(0, 0, 0, 0.25)";
    } 
    else {
        context.fillStyle = "rgba("+colorsRed[wedgeIndex]+", "+colorsGreen[wedgeIndex]+", "+colorsBlue[wedgeIndex]+", 1.0)";
        context.strokeStyle = "#000000";
    }

    context.strokeWidth = 1;

    context.translate(150, 150);
    context.rotate(((3.14159*2)/wedgeCount)*wedgeIndex);

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(145, 0);
    context.arc(0, 0, 145, 0, ((3.14159*2)/wedgeCount), 0);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(145, 0);
    context.arc(0, 0, 145, 0, ((3.14159*2)/wedgeCount), 0);
    context.closePath();
    context.stroke();

    context.restore();
}

var baserad = 145;
var sqrt2 = Math.sqrt(2);
var tanpt = baserad/sqrt2;
var cntlpt = baserad*sqrt2;
var diffcent = 40;
var secrad = Math.sqrt(baserad*baserad + diffcent*diffcent + 2*diffcent*baserad/sqrt2);
var seccntlpt = baserad/sqrt2 + (sqrt2*baserad*baserad)/(2*(sqrt2*diffcent + baserad));

function drawHighlight(context, color, angle) {
    context.save();
    context.translate(150, 150);
    context.rotate(angle);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(tanpt, -tanpt);
    context.arcTo(cntlpt, 0, tanpt, tanpt, baserad);
    context.arcTo(seccntlpt, 0, tanpt, -tanpt, secrad);
    context.closePath();
    context.fill();
    context.restore();
}

// Spinner

var spinnerAngle = 0;

var spinnerVelocity = 0;

var spinnerInterval = null;

function drawSpinner(incontext) {
    var context = incontext;
    if(context == null)
        context = ctx.spinnercanvas;

    context.save();
    //context.scale(.18966, .18966);

    context.clearRect(0, 0, 300, 300);

    context.translate(150, 150);
    context.scale(10, 10);

    //clear everything out

    //rotate context to proper orientation
    context.rotate(spinnerAngle);

    //setup color, style, etc.
    context.lineWidth = 0.2;
    context.lineJoin = "round";
    context.lineCap = "round";
    if(selectedWedge == -1) {
        context.strokeStyle = "#000000";
        context.fillStyle = "#FFFFFF";
    }
    else {
        context.strokeStyle = "rgba(0, 0, 0, 0.25)";
        context.fillStyle = "rgba(255, 255, 255, 0.25)";
    }

    //drawing spinner
    context.beginPath();
    context.moveTo(11, 0);

    //right side
    context.lineTo(8, 2);
    context.quadraticCurveTo(8, 0.5, 7, 0.5);
    context.lineTo(1, 0.5);
    context.arc(0, 0, 1, 3.14159/6, 3.14159*(5/6), 0);
    context.lineTo(-8, 0.5);
    context.arc(-8, 1.5, 1, 3.14159*(3/2), 3.14159, 1);
    context.lineTo(-12, 1.5);
    context.lineTo(-10, 0);

    //left side
    context.lineTo(-12, -1.5);
    context.lineTo(-9, -1.5);
    context.arc(-8, -1.5, 1, 3.14159, 3.14159/2, 1);
    context.lineTo(-1, -0.5);
    context.arc(0, 0, 1, 3.14159*(7/6), 3.14159*(11/6), 0);
    context.lineTo(7, -0.5);
    context.quadraticCurveTo(8, -0.5, 8, -2);
    context.lineTo(11, 0);

    //end
    context.closePath();
    context.fill();

    //drawing spinner
    context.beginPath();
    context.moveTo(11, 0);

    //right side
    context.lineTo(8, 2);
    context.quadraticCurveTo(8, 0.5, 7, 0.5);
    context.lineTo(1, 0.5);
    context.arc(0, 0, 1, 3.14159/6, 3.14159*(5/6), 0);
    context.lineTo(-8, 0.5);
    context.arc(-8, 1.5, 1, 3.14159*(3/2), 3.14159, 1);
    context.lineTo(-12, 1.5);
    context.lineTo(-10, 0);

    //left side
    context.lineTo(-12, -1.5);
    context.lineTo(-9, -1.5);
    context.arc(-8, -1.5, 1, 3.14159, 3.14159/2, 1);
    context.lineTo(-1, -0.5);
    context.arc(0, 0, 1, 3.14159*(7/6), 3.14159*(11/6), 0);
    context.lineTo(7, -0.5);
    context.quadraticCurveTo(8, -0.5, 8, -2);
    context.lineTo(11, 0);

    //end
    context.closePath();
    context.stroke();

    context.restore();
}

function moveAndDraw() {
    spinnerAngle = spinnerAngle + spinnerVelocity;

    if(spinnerAngle > 2*3.14159) {
        spinnerAngle = spinnerAngle - 2*3.14159;
    }

    spinnerVelocity -= 3.14159/90;

    if(spinnerVelocity <= 0) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
        //now that spinner is stopped, zoom in on where it was
        zoomRate = 0.1;
        zoomLevel = 1;

        for(i = 0; i < wedgeCount; i++) {
            if((spinnerAngle >= (2*3.14159/wedgeCount)*i) &&
	       (spinnerAngle < (2*3.14159/wedgeCount)*(i+1))) {
	        selectedWedge = i;
	        break;
            }
        }

        elts.wedgelabel.innerText = wedgeNames[selectedWedge];
        
        //zoom to center of selected wedge
        zoomXPoint = -1*Math.cos((2*3.14159/wedgeCount)*selectedWedge+(3.14159/wedgeCount))*75;
        zoomYPoint = -1*Math.sin((2*3.14159/wedgeCount)*selectedWedge+(3.14159/wedgeCount))*75;
        zoomInterval = setInterval(zoomOnSelection, 75);
    }

    drawSpinner();
}

var zoomInterval = null;
var zoomRate = 0;
var zoomLevel = 1;

var zoomXPoint = 0;
var zoomYPoint = 0;

function zoomOnSelection() {
    var spincontext = ctx.spinnercanvas;
    var boardcontext = ctx.boardcanvas;

    if(zoomLevel >= 2) {
        boardcontext.save();
        boardcontext.translate(-150, -150);
        boardcontext.scale(2, 2);
        boardcontext.translate(zoomXPoint, zoomYPoint);
        drawBoard(boardcontext);
        boardcontext.restore();

        spincontext.save();
        spincontext.translate(-150, -150);
        spincontext.scale(2, 2);
        spincontext.translate(zoomXPoint, zoomYPoint);
        drawSpinner(spincontext);
        spincontext.restore();

        elts.wedgelabel.style.display = "block";

        clearInterval(zoomInterval);
        zoomInterval = null;
    }
    else {
        boardcontext.save();
        boardcontext.translate(150-(150*zoomLevel), 150-(150*zoomLevel));
        boardcontext.scale(zoomLevel, zoomLevel);
        boardcontext.translate(zoomXPoint*(zoomLevel-1), zoomYPoint*(zoomLevel-1));
        drawBoard(boardcontext);
        boardcontext.restore();

        spincontext.save();
        spincontext.translate(150-(150*zoomLevel), 150-(150*zoomLevel));
        spincontext.scale(zoomLevel, zoomLevel);
        spincontext.translate(zoomXPoint*(zoomLevel-1), zoomYPoint*(zoomLevel-1));
        drawSpinner(spincontext);
        spincontext.restore();

        zoomLevel += zoomRate;
        zoomRate += 0.1;
    }
    
}

function startSpinner() {
    //do nothing if already spinning
    if(spinnerInterval == null && zoomInterval == null) {
        selectedWedge = -1;
        elts.wedgelabel.style.display = "none";
        drawBoard();
        drawSpinner();
        spinnerVelocity = 3.14159/3 * (Math.random()+1);
        
        spinnerInterval = setInterval(moveAndDraw, 50);
    }
}

// Widget Utilities

function showBack()
{
    if(window.widget) {
        widget.prepareForTransition("ToBack");

        //  document.getElementById('fliprollie').style.display = 'none';
        elts.front.style.visibility="hidden";
        elts.flipbutton.style.display="none";
        elts.back.style.visibility="visible";

        document.getElementById('divnames').focus();

        if(window.widget)
            setTimeout('widget.performTransition();', 0);
    } else {
        nextClass="flipped";
        elts.card.className = "fliphalf";
    }
}

function clearCanvas() {
    ctx.boardcanvas.clearRect(0, 0, 300, 300);
    ctx.spinnercanvas.clearRect(0, 0, 300, 300);
}

function hideBack()
{
    if(window.widget) {
        widget.prepareForTransition("ToFront");
        setPref("wedgeNames", elts.divnames.value);

        setupWedges(elts.divnames.value);

        selectedWedge = -1;
        elts.wedgelabel.style.display = "none";

        elts.back.style.visibility="hidden";
        elts.front.style.visibility="visible";
        elts.flipbutton.style.display="block";
        drawBoard();
        drawSpinner();

        setTimeout("drawAndFlip();", 0);
    } else {
        setPref("wedgeNames", elts.divnames.value);

        setupWedges(elts.divnames.value);

        selectedWedge = -1;
        elts.wedgelabel.style.display = "none";

        nextClass="";
        elts.card.className = "fliphalf";
        setTimeout("drawAndFlip();", 0);
    }
}

function drawAndFlip() {
    drawBoard();
    drawSpinner();
    if(window.widget)
        setTimeout('widget.performTransition();', 0);
}
