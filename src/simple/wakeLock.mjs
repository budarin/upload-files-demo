let wakeLock;

let locks = 0;

export const requestWakeLock = () => {
    wakeLock = navigator.wakeLock.request('screen');
    locks++;
};

export const releaseWakeLock = () => {
    if (locks) {
        locks--;
        return;
    }

    if (wakeLock) {
        wakeLock.release();
        wakeLock = undefined;
    }
};
