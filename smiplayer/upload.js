var smiFileData = null

document.getElementById('upload_button').addEventListener('click', function() {
    var fileInput = document.getElementById('file_input');
    var file = fileInput.files[0];

    if (file) {
        // extension check (file extension must be .smi)
        var extension = file.name.split('.').pop().toLowerCase();
        if(extension != "smi") {
            alert("Not supported file");
            return;
        }
        
        var reader = new FileReader();
        reader.readAsText(file, "EUC-KR");
        reader.onload = function (evt) {
            var data = JSON.stringify(evt.target.result)
            var parseResult = parseSMI(data);
            if(parseResult.errors.length > 0){
                alert("An error ocurred decoding the smi file");
                console.log(parseResult.errors);
                return;
                // TODO : handle error msg
            }
            if(parseResult.warnings.length > 0) {
                console.log(parseResult.warnings);
            }
            var subtitles = parseResult.result;
            smiFileData = subtitles;
            console.log(subtitles);
            /*
            chrome.tabs.executeScript({
                code: 'var fileContent = ' + JSON.stringify(evt.target.result)
            }, function() {
                chrome.tabs.executeScript({file: 'showSubtitle.js'});
            });
            */
        }
        reader.onerror = function (evt) {
            console.error("An error ocurred reading the smi file", evt);
        };
    }
});

// util
function msToMS(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
  
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}





var playButton = document.getElementById('play');
var stopButton = document.getElementById('stop');
var pauseButton = document.getElementById('pause');
var playSlider = document.getElementById('slider_play');

var currentTimeViewElement = document.getElementById('time_current');
var subtitleContentElement = document.getElementById('subtitle_content');
//var subtitleContentPopupWindow = window.open('', 'MyPopup', 'width=600,height=200'); // 팝업

// 나중에 익명클로저로 아래 감싸기
// (function() {
//     setTimeout(0.1);
// })();

// milliseconds
var isPlaying = false; 
var timer = 0; 

var startTime = 0;
var currentTime = 0;

function timerCallback() {
    currentTime = new Date().getTime();
    if(isPlaying){
        timer = currentTime-startTime; // update timer
        updater(timer);
    } else {
        startTime = currentTime - timer; // update start time
    }
    setTimeout(timerCallback,10); // interval : 100 milliseconds
}

function playTimer() {
    isPlaying = true;
}

function pauseTimer() {
    isPlaying = false;
}

function stopTimer() {
    isPlaying = false;
    resetTime(0);
}

function resetTime(timeToSet) {
    currentTime = new Date().getTime();
    startTime = currentTime - timeToSet;
    timer = timeToSet;
    updater(timer);
}








// 위 두 모듈 총괄, updater는 timer가 변경되었을 때마다 호출된다. (play, stop)
function updater(timer) {
    var formattedTime = msToMS(timer);
    if(currentTimeViewElement.textContent != formattedTime)
        currentTimeViewElement.textContent = formattedTime; // M:S update

    if(!smiFileData) return;

    // subtitle
    const subtitles = smiFileData.subtitles;

    // TODO : 실행 빈도 줄이기
    // 재생바 표시
    const maxKey = Math.max.apply(null,Object.keys(subtitles));
    playSlider.max = maxKey;
    playSlider.value = timer; // 타이머로

    // subtitle 표시
    const lastKey = Math.max(...Object.keys(subtitles).filter(key => key < timer));
    const lastSync = subtitles[lastKey];
    if(lastSync){
        const content = lastSync[0].content; // 임시
        setSubtitleContent(content);
    }
} // TODO: updater를 timer 모듈에 hardcoding하지 않고, 바인딩 해야 함.


function setSubtitleContent(content) {
    subtitleContentElement.innerHTML = content;
}


function play() {
    if(!smiFileData) {
        alert("Please upload subtitle file");
        return;
    }

    playTimer();
}

function pause() {
    pauseTimer();
}

function stop() {
    subtitleContentElement.innerHTML = "";
    stopTimer();
}

function changeTime(time) {
    resetTime(time);
}




playButton.addEventListener('click', function(){play()});
stopButton.addEventListener('click', function(){stop()});
pauseButton.addEventListener('click', function(){pause()});
playSlider.addEventListener("mousedown", function () {pause()});
playSlider.addEventListener("input", function() {changeTime(playSlider.value)});
playSlider.addEventListener("mouseup", function () {changeTime(playSlider.value)});


timerCallback();