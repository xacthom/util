
function gameStart() {
    lastUpdate = 0;
    lastSiteId = 0;
    lastUpdateApplied = 0;
    selectedAmmo = 1;
    joinArena();
    updateHandle = setInterval(updateAll, 1000);
    joinTime = 0;
    jumpUpPossible = 0;
    jumpDownPossible = 0;
    jumpTimer = 0;
    jumpTimerChange = 0;
    reloadTime = 0;
    ownUserid = 0;
    arenaLevel = 0;
    lastLogId = 0;
    targetType = "";
    targetId = 0;
    targetSlot = 0;
    attackType = "";
    attackId = 0;
    attacking = 0;
    attackHandle = null;
    lastAttackSquareId = 0;
    lastDamageTextId = 0;
    lastAnimationId = 0;
    repairHandle = null;
    isDead = 0;
    $(document).keypress(function(e) {
        if (e.which === 77 || e.which === 109) { //m
            useMedipack();
        } else if (e.which === 49) { //1
            selectAmmo1();
        } else if (e.which === 50) { //2
            selectAmmo2();
        } else if (e.which === 51) { //3
            selectAmmo3();
        } else if (e.which === 85 || e.which === 117) { //u
            jumpup();
        } else if (e.which === 74 || e.which === 106) { //j
            jump();
        } else if (e.which === 68 || e.which === 100) { //d
            jumpdown();
        } else if (e.which === 76 || e.which === 108) { //l
            logout();
        } else if (e.which === 81 || e.which === 113) { //q
            startAttack();
        } else if (e.which === 87 || e.which === 119) { //w
            abortAttack();
        } else if (e.which === 82 || e.which === 114) { //r
            toggleRepair();
        }
    });
}

function joinArena() {
    lastUpdate = Date.now();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            joinTime = Date.now();
            applyJoinArena(xmlhttp.responseText);
            applyUpdate(xmlhttp.responseText);
        } else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    };
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=joinArena" + "&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
}

function applyJoinArena(str) {
    jumpUpPossible = parseInt(str.substring(str.indexOf('<ju!>')+5, str.indexOf('</ju!>')));
    jumpDownPossible = parseInt(str.substring(str.indexOf('<jd!>')+5, str.indexOf('</jd!>')));
    jumpTimer = parseInt(str.substring(str.indexOf('<jt!>')+5, str.indexOf('</jt!>')));
    jumpTimerChange = parseInt(str.substring(str.indexOf('<jtc!>')+6, str.indexOf('</jtc!>')));
    reloadTime = parseFloat(str.substring(str.indexOf('<rt!>')+5, str.indexOf('</rt!>')));
    reloadTime = parseInt(reloadTime*1000);
    ownUserid = parseInt(str.substring(str.indexOf('<ownuid!>')+9, str.indexOf('</ownuid!>')));
    arenaLvl = parseInt(str.substring(str.indexOf('<al!>')+5, str.indexOf('</al!>')));
    document.getElementById("arenalvlText").innerHTML = "Your current Arenalevel: "+arenaLvl;
}

function updateAll() {
    if (lastUpdate > Date.now()-700) {
        //console.log("Update abort due to recent update.");
        return false;
    }
    lastUpdate = Date.now();
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            applyUpdate(xmlhttp.responseText);
        } else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    };
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php" + "?lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
}

function applyUpdate(str) {
    console.log(str);
    //allgemeine Nachrichten
    if (str === "not_loggedin") {
        clearInterval(updateHandle);
        alert("You seem to not be logged in!");
        window.close();
    }
    if (str === "logout_done") {
        clearInterval(updateHandle);
        clearInterval(attackHandle);
        alert("You were successfully logged out.");
        window.close();
    }
    if (str === "dead") {
        if (isDead === 0) {
            $("#deathModal").modal("show");
            isDead = 1;
        }
        return;
    }
    //prÃ¼fen ab schon neueres applied
    lsid = parseInt(str.substring(str.indexOf('<lsid!>')+7, str.indexOf('</lsid!>')));
    if (lsid <= lastUpdateApplied) {
        return false;
    }
    lastUpdateApplied = lsid;
    
    //spieler und npcs
    for(s=1; s<=20; s++) {
        dif = 5;
        if (s>=10) {
            dif = 6;
        }
        json = str.substring(str.indexOf('<s'+s+'!>')+dif, str.indexOf('</s'+s+'!>'));
        if (json === "e") {
            document.getElementById("s"+s).innerHTML = "";
            //unsichtbar schalten
            $('#s'+s).animate({opacity: 0}, 500);
            setTimeout(hideSlot, 500, s);
            continue;
        }
        var data = $.parseJSON(json); 
        
        //Bild
        var image = '';
        if (data['type'] === 'player') {
            image = "img/zielscheibe.gif";
        } else {
            image = data['image'];
        }
        var input = '<img class="playerlogo" src="'+image+'"></img>';
        
        //Beschriftung
        var color = 'black';
        if (data['type'] === 'npc') {
            color = 'darkgray';
        }
        input = input + '<div class="playername" style="color: '+color+';">'+data['name']+'</div>';
        //HP
        var width = Math.ceil(146*parseInt(data['hp'])/parseInt(data['maxhp']));
        input = input + '<div class="playerhealth" style="width: '+width+'px;"></div>';
        
        //Variablen
        input = input + '<input type="hidden" id="s'+s+'type" value="'+data['type']+'">';
        input = input + '<input type="hidden" id="s'+s+'id" value="'+data['id']+'">';
        
        //Rahmen und sichtbar schalten
        if (targetSlot === s && targetId == data['id'] && targetType == data['type']) {
            $('#s'+s).css("border-color", "rgb(255,191,0)");
            $('#s'+s).css("border-style", "dashed");
        }
        else if (data['type'] === 'player' && parseInt(data['id']) === ownUserid) {
            $('#s'+s).css("border-style", "dashed");
            $('#s'+s).css("border-color", "rgb(64,200,64");
        } else if (data['type'] === "player") {
            $('#s'+s).css("border-color", "rgb(20,20,164)");
            $('#s'+s).css("border-style", "solid");
        } else {
            //NPC
            $('#s'+s).css("border-color", "gray");
            $('#s'+s).css("border-style", "solid");
        }
        
        //Animation
        var display = $('#s'+s).css("display");
        $('#s'+s).css("display", "block");
        if (display === "none") {
            $('#s'+s).css("opacity", 0);
            $('#s'+s).animate({opacity: 1}, 500);
        }
         $('#s'+s).css("opacity", 1);
        
        $('#s'+s).css("display", "block");
        document.getElementById("s"+s).innerHTML = input;
    }
    

    //Boxen
    for (b=1; b<=8; b++) {
        json = str.substring(str.indexOf('<b'+b+'!>')+5, str.indexOf('</b'+b+'!>'));
        if (json === "e") {
            //unsichtbar schalten
            if ($('#b'+b).css("display") === "block" && $('#b'+b).css("opacity") == 1) {
                $('#b'+b).animate({opacity: 0}, 400);
            }
            setTimeout(hideBox, 400, b);
            continue;
        }
        var data = $.parseJSON(json);
        document.getElementById("b"+b).innerHTML = '<img src="'+data['image']+'" onclick="clickBox('+data['id']+')"></img>';
        //Animation
        var display = $('#b'+b).css("display");
        if (display === "none") {
            $('#b'+b).css("opacity", 0);
            $('#b'+b).css("display", "block");
            $('#b'+b).animate({opacity: 1}, 500);
        } else {
            $('#b'+b).css("opacity", 1);
        }
    }
    
    
    //Logs
    var logtext = str.substring(str.indexOf('<log!>')+6, str.indexOf('</log!>'));
    var logs = logtext.split("|");
    for (i=0; i < logs.length; i++) {
        lastLogId++;
        if (logs[i] === "" ) {
            continue;
        }
        addLog(lastLogId, logs[i]);
    }

    //Items
    $('#am1text').html(str.substring(str.indexOf('<am1!>')+6, str.indexOf('</am1!>')));
    $('#am2text').html(str.substring(str.indexOf('<am2!>')+6, str.indexOf('</am2!>')));
    $('#am3text').html(str.substring(str.indexOf('<am3!>')+6, str.indexOf('</am3!>')));
    $('#medipacktext').html(str.substring(str.indexOf('<medi!>')+7, str.indexOf('</medi!>')));
    
    //Animationen
    var animationsText = str.substring(str.indexOf('<ani!>')+6, str.indexOf('</ani!>'));
    var animations = animationsText.split("|");
    for(i=0; i < animations.length; i++) {
        if (animations[i] === "") {
            continue;
        }
        var data = $.parseJSON(animations[i]);
        if (data['type'] === "1") {
            //einfacher Angriff
            lastAttackSquareId++;
            var color = "gray";
            if (data['amount2'] === "2") {
                color = "blue";
            } else if (data['amount2'] === "3") {
                color = "red";
            }
            $('#body').append('<div class="attacksquare" id="as'+lastAttackSquareId+'" style="background-color: '+color+'; top: '+(getAnipointY(data['zid1'])-10)+'px; left: '+(getAnipointX(data['zid1'])-10)+'px;"></div>');
            var speed = Math.floor(Math.random()*100 + 350);
            $('#as'+lastAttackSquareId).animate({
                top: (getAnipointY(data['zid2'])-10)+"px",
                left: (getAnipointX(data['zid2'])-10)+"px"
            }, speed);
            setTimeout(removeAnimationsquare, speed, lastAttackSquareId);
            
            //Schadenstext
            lastDamageTextId++;
            var top = getAnipointY(data['zid2'])-10;
            var left = $('#s'+data['zid2']).css("left");
            var left = parseInt($('#s'+data['zid2']).css("left"), 10);
            $('#body').append('<div class="damageText" id="dt'+lastDamageTextId+'" style="top: '+top+'px; left: '+left+'px;">'+data['amount1']+'</div>');
            var speed = Math.floor(Math.random()*300 + 850);
            var moveLeft = Math.floor(Math.random()*50-25);
            var newLeft = left + moveLeft;
            $('#dt'+lastDamageTextId).animate({
                top: (top-50)+"px",
                left: newLeft+"px",
                opacity: 0.5
            }, speed);
            setTimeout(removeDamageText, speed, lastDamageTextId);
            
        } else if (data['type'] === "2") {
            //kritischer Angriff
            lastAttackSquareId++;
            var color = "gray";
            if (data['amount2'] === "2") {
                color = "blue";
            } else if (data['amount2'] === "3") {
                color = "red";
            }
            $('#body').append('<div class="attacksquareCritical" id="as'+lastAttackSquareId+'" style="background-color: '+color+'; top: '+(getAnipointY(data['zid1'])-15)+'px; left: '+(getAnipointX(data['zid1'])-15)+'px;"></div>');
            var speed = Math.floor(Math.random()*100 + 350);
            $('#as'+lastAttackSquareId).animate({
                top: (getAnipointY(data['zid2'])-15)+"px",
                left: (getAnipointX(data['zid2'])-15)+"px"
            }, speed);
            setTimeout(removeAnimationsquare, speed, lastAttackSquareId);
            
            //Schadenstext
            lastDamageTextId++;
            var top = getAnipointY(data['zid2'])-10;
            var left = $('#s'+data['zid2']).css("left");
            var left = parseInt($('#s'+data['zid2']).css("left"), 10);
            $('#body').append('<div class="damageText" id="dt'+lastDamageTextId+'" style="top: '+top+'px; left: '+left+'px; font-size: 18px; font-weight: bold;">'+data['amount1']+'</div>');
            var speed = Math.floor(Math.random()*300 + 850);
            var moveLeft = Math.floor(Math.random()*50-25);
            var newLeft = left + moveLeft;
            $('#dt'+lastDamageTextId).animate({
                top: (top-50)+"px",
                left: newLeft+"px",
                opacity: 0.5
            }, speed);
            setTimeout(removeDamageText, speed, lastDamageTextId);
            
        } else if (data['type'] === "3") {
            //Jump Animation
            lastAnimationId++;
            var left = parseInt($('#s'+data['zid1']).css("left"), 10)+15;
            var top = parseInt($('#s'+data['zid1']).css("top"), 10)-40;
            console.log('style="top: '+top+'px; left: '+left+'px;');
            $('#body').append('<div class="jumpAnimation" id="a'+lastAnimationId+'" style="top: '+top+'px; left: '+left+'px; opacity: 0;"></div>');
            $('#a'+lastAnimationId).animate({
                opacity: 1
            }, 4500);
            setTimeout(hideJumpAnimation, 4500, lastAnimationId);
            
        } else if (data['type'] === "4") {
            //Repair abbrechen
            abortRepair();
        } else if (data['type'] === "5") {
            //Leben erhalten
            lastDamageTextId++;
            var top = getAnipointY(data['zid1'])-10;
            var left = $('#s'+data['zid1']).css("left");
            $('#body').append('<div class="damageText" id="dt'+lastDamageTextId+'" style="top: '+top+'px; left: '+left+'; color: green;">'+data['amount1']+'</div>');
            $('#dt'+lastDamageTextId).animate({
                top: (top-50)+"px",
                opacity: 0.5
            }, 1000);
            setTimeout(removeDamageText, 1000, lastDamageTextId);
        } else if (data['type'] === "6") {
            //Medipacktimer starten
            $('#medipackbar').css("width", "60px");
            $('#medipackbar').animate({
                width: "0px"
            }, 30000);
        } else if (data['type'] === "7") {
            //Angriff abbrechen
            abortAttack();
        } else if (data['type'] === "8") {
            //Jump Animation
            lastAnimationId++;
            var left = parseInt($('#s'+data['zid1']).css("left"), 10)+15;
            var top = parseInt($('#s'+data['zid1']).css("top"), 10)-40;
            console.log('style="top: '+top+'px; left: '+left+'px;');
            $('#body').append('<div class="jumpAnimationUp" id="a'+lastAnimationId+'" style="top: '+top+'px; left: '+left+'px; opacity: 0;"></div>');
            $('#a'+lastAnimationId).animate({
                opacity: 1
            }, 4500);
            setTimeout(hideJumpAnimation, 4500, lastAnimationId);
            
        } else if (data['type'] === "9") {
            //Jump Animation
            lastAnimationId++;
            var left = parseInt($('#s'+data['zid1']).css("left"), 10)+15;
            var top = parseInt($('#s'+data['zid1']).css("top"), 10)-40;
            console.log('style="top: '+top+'px; left: '+left+'px;');
            $('#body').append('<div class="jumpAnimationDown" id="a'+lastAnimationId+'" style="top: '+top+'px; left: '+left+'px; opacity: 0;"></div>');
            $('#a'+lastAnimationId).animate({
                opacity: 1
            }, 4500);
            setTimeout(hideJumpAnimation, 4500, lastAnimationId);
            
        }
    }
    
    //lastUpdatetimer setzen
    lastUpdate = Date.now();
}

function hideJumpAnimation(id) {
    $('#a'+id).animate({
        opacity: 0
    }, 700);
    setTimeout(removeJumpAnimation, 700, id);
}

function removeJumpAnimation(id) {
    $('#a'+id).remove();
}

function hideSlot(s) {
    $('#s'+s).css("display", "none");
    $('#s'+s).css("opacity", 1);
}

function hideBox(b) {
    $('#b'+b).css("display", "none");
    $('#b'+b).css("opacity", 1);
    document.getElementById("b"+b).innerHTML = "";
}

function removeAnimationsquare(id) {
    $('#as'+id).remove();
}

function removeDamageText(id) {
    $('#dt'+id).remove();
}

function clickSlot(slot) {
    //Anklicken eines Spielers, anvisieren
    //prÃ¼fen ob Ã¼berhaupt besetzt
    if ($('#s'+slot).html() === "" ) {
        return;
    }
    
    //Daten laden
    type = $('#s'+slot+'type').val();
    id = $('#s'+slot+'id').val();
    
    //eigenen Slot abfangen
    if (type === "player" && id == ownUserid) {
        return;
    }
    
    //Rahmen vom alten Target korrigieren
    if ($('#s'+targetSlot+'type').val() === targetType && $('#s'+targetSlot+'id').val() == targetId) {
        //altes Target korrekt besetzt
        if ($('#s'+targetSlot+'type').val() == "player") {
            $('#s'+targetSlot).css("border-color", "rgb(20,20,164)");
            $('#s'+targetSlot).css("border-style", "solid");
        } else {
            $('#s'+targetSlot).css("border-color", "gray");
            $('#s'+targetSlot).css("border-style", "solid");
        }
    }
    //target Variablen setzen
    targetType = type;
    targetId = id;
    targetSlot = slot;
    
    //Rahmen anpassen
    $('#s'+targetSlot).css("border-color", "rgb(255,191,0)");
    $('#s'+targetSlot).css("border-style", "dashed");
    
}

function clickBox(id) {
    //anklicken einer Box
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=box&id=" + id + "&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function addLog(id, text) {
    var input = '<div class="logelement" id="log'+id+'" style="display:none">'+text+'</div>';
    $('#logs').append(input);
    $('#log'+id).show(300);
    setTimeout(hideLog, 4300, id);
}

function hideLog(id) {
    $('#log'+id).hide(200);
    setTimeout(removeLog, 1000, id)
}

function removeLog(id) {
    $('#log'+id).remove();
}

function startAttack() {
    if (attacking === 1 && attackType === targetType && attackId === targetId) {
        //akutell angegriffener Spieler
        return;
    }
    //Angriff starten
    attackId=targetId;
    attackType = targetType;
    clearInterval(attackHandle);
    attack();
    attackHandle = setInterval(attack, reloadTime);
}

function abortAttack() {
    clearInterval(attackHandle);
    attacking = 0;
}

function attack() {
    if (targetId == 0) {
        return;
    }
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=at&id=" + attackId + '&type='+ attackType + '&ammo=' + selectedAmmo + "&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function selectAmmo1() {
    selectedAmmo = 1;
    $("#am1").css("border-color", "red");
    $("#am2").css("border-color", "gray");
    $("#am3").css("border-color", "gray");
}

function selectAmmo2() {
    selectedAmmo = 2;
    $("#am1").css("border-color", "gray");
    $("#am2").css("border-color", "red");
    $("#am3").css("border-color", "gray");
}

function selectAmmo3() {
    selectedAmmo = 3;
    $("#am1").css("border-color", "gray");
    $("#am2").css("border-color", "gray");
    $("#am3").css("border-color", "red");
}

function jump() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var jumpText = xmlhttp.responseText.substring(xmlhttp.responseText.indexOf('<reqj!>')+7, xmlhttp.responseText.indexOf('</reqj!>'));
            if (jumpText === "1") {
                setTimeout(jumpDo, 5000);
            }
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=reqJump&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function jumpDo() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=jump&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function jumpup() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var jumpText = xmlhttp.responseText.substring(xmlhttp.responseText.indexOf('<reqj!>')+7, xmlhttp.responseText.indexOf('</reqj!>'));
            if (jumpText === "1") {
                setTimeout(jumpupDo, 5000);
            }
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=reqJumpup&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function jumpupDo() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var arenaLvl = xmlhttp.responseText.substring(xmlhttp.responseText.indexOf('<al!>')+5, xmlhttp.responseText.indexOf('</al!>'));
            document.getElementById("arenalvlText").innerHTML = "Your current Arenalevel: "+arenaLvl;
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=jumpup&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function jumpdown() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var jumpText = xmlhttp.responseText.substring(xmlhttp.responseText.indexOf('<reqj!>')+7, xmlhttp.responseText.indexOf('</reqj!>'));
            if (jumpText === "1") {
                setTimeout(jumpdownDo, 5000);
            }
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=reqJumpdown&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function jumpdownDo() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var arenaLvl = xmlhttp.responseText.substring(xmlhttp.responseText.indexOf('<al!>')+5, xmlhttp.responseText.indexOf('</al!>'));
            document.getElementById("arenalvlText").innerHTML = "Your current Arenalevel: "+arenaLvl;
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=jumpdown&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function getAnipointX(slot) {
    slot = parseInt(slot);
    if (slot === 1 || slot === 10) {
        return 380;
    } else if (slot === 2 || slot === 9) {
        return 360;
    } else if (slot === 3 || slot === 8) {
        return 340;
    } else if (slot === 4 || slot === 7) {
        return 320;
    } else if (slot === 5 || slot === 6) {
        return 300;
    } 
    else if (slot === 11 || slot === 20) {
        return 420;
    } else if (slot === 12 || slot === 19) {
        return 440;
    } else if (slot === 13 || slot === 18) {
        return 460;
    } else if (slot === 14 || slot === 17) {
        return 480;
    } else if (slot === 15 || slot === 16) {
        return 500;
    }
}

function getAnipointY(slot) {
    slot = parseInt(slot);
    if (slot === 1 || slot === 11) {
        return 30;
    } else if (slot === 2 || slot === 12) {
        return 80;
    } else if (slot === 3 || slot === 13) {
        return 130;
    } else if (slot === 4 || slot === 14) {
        return 180;
    } else if (slot === 5 || slot === 15) {
        return 230;
    } else if (slot === 6 || slot === 16) {
        return 280;
    } else if (slot === 7 || slot === 17) {
        return 330;
    } else if (slot === 8 || slot === 18) {
        return 380;
    } else if (slot === 9 || slot === 19) {
        return 430;
    } else if (slot === 10 || slot === 20) {
        return 480;
    }
}

function logout() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=logout&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function repair() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=repair&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function startRepair() {
    //Beschriftung
    $('#repair').html('Stop Repair');
    //Interval
    repair();
    repairHandle = setInterval(repair, 5000);
}

function abortRepair() {
    $('#repair').html('Repair');
    clearInterval(repairHandle);
}

function toggleRepair() {
    if ($('#repair').html() == 'Stop Repair') {
        abortRepair();
    } else {
        startRepair();
    }
}

function useMedipack() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=useMedi&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
}

function respawnNormal() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            $('#deathModal').modal("hide");
            isDead = 0;
            applyUpdate(xmlhttp.responseText);
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=respawnNormal&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
    $('#deathModal').modal("hide");
}

function respawnSafe() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            $('#deathModal').modal("hide");
            isDead = 0;
            document.getElementById("arenalvlText").innerHTML = "Your current Arenalevel: 1";
            applyUpdate(xmlhttp.responseText);
            
        }else {
            if (xmlhttp.status === 500) {
                //alert("You were killed.");
                //window.close();
            }
        }
    }
    lastSiteId++;
    xmlhttp.open("GET", "gamenew.php?a=respawnSafe&lsid=" + lastSiteId);
    xmlhttp.timeout = 10000;
    xmlhttp.send();
    lastUpdate = Date.now();
    $('#deathModal').modal("hide");
}
