
// parse SMI
/*
return object
result : result, if any error occurs, it returns null
errors : an array of fatal error strings
warnings : an array of warning strings

*/
function parseSMI (data) {
    var headPattern = /<HEAD>(.*?)<\/HEAD>/i 
    var titlePattern = /<\s*Title>(.*?)<\s*\/\s*Title\s*>/i
    var bodyPattern = /<BODY>(.*?)<\/BODY>/i 
    var SYNCPattern = /<\s*SYNC\s+Start\s*=\s*(\d+)>(.*?)(?=<\s*SYNC|$)/g // parse SYNC, group 1: start, 2: content
    // a <SYNC> tag may not has a matching </SYNC>
    var PPattern = /<P\s+Class\s*=\s*(.*?)>(.*?)(?=<\/P>|$)/g  // parse P, group 1: classname, 2: content
    // a <P> tag may not has a matching </SYNC>
    var result = new Object();
    var errorMSG = [];
    var warningMSG = [];

    data = data.replace(/\\r\\n/g, ""); 
    data = data.replace(/\n/g, ""); 
    
    // <HEAD> parse
    var heads = data.match(headPattern);
    if(heads){ 
        var title = data.match(titlePattern);
        if(title)
            result.title = title[1];
    } else
        warningMSG.push("no head in SMI file");


    // <BODY> parse
    matches = data.match(bodyPattern);
    if(matches) {
        var body = matches[1];

        // <SYNC> parse
        var matches = [...body.matchAll(SYNCPattern)];
        if(matches){
            var subtitles = {};
            for(const sy of matches) {
                if(sy.length == 3){ // index 1: start, 2: content
                    var start = sy[1];
                    var contentRaw = sy[2];
                    var subtitle_classes = [];

                    // <P class> 파싱
                    var matches = [...contentRaw.matchAll(PPattern)];
                    if(matches) {
                        for(const p of matches) {
                            if(p.length == 3) // 1: classname, 2: content
                                subtitle_classes.push({class:p[1],content:p[2]});
                        }
                    } else {
                        subtitle_classes = [{class:"",content:contentRaw}];
                    } // else : fill content with itself and empty the classname, if there's no <P class> tag inside <SYNC>
                    
                    subtitles[start] = subtitle_classes
                } // else : invalid <SYNC>
            }
            result.subtitles = subtitles;
        } else 
            warningMSG.push("no SYNC");

    } else {
        errorMSG.push("no body in SMI file");
    }

    return {result: result,errors: errorMSG, warnings: warningMSG};
}


