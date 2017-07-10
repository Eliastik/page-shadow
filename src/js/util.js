function in_array(needle, haystack) {
    var key = '';
        for (key in haystack) {
            if (needle.indexOf(haystack[key]) != -1) {
                return true;
            }
        }

    return false;
}

function strict_in_array(needle, haystack) {
    var key = '';
        for (key in haystack) {
            if (needle == haystack[key]) {
                return true;
            }
        }

    return false;
}

function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}


function getUImessage(id) {
    return chrome.i18n.getMessage(id);
}
