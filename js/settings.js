"use strict";


/* =========================================================
   DOTS UNO
   GLOBÁLNÍ NASTAVENÍ

   Ukládá se mimo save sloty.

   Aktuálně:
   - zapnutá / vypnutá hudba
========================================================= */


/* =========================================================
   VÝCHOZÍ NASTAVENÍ
========================================================= */

function createDefaultSettings() {

    return {

        musicEnabled:
            Boolean(
                GAME_CONFIG
                    .music
                    .enabledByDefault
            )
    };
}


/* =========================================================
   NORMALIZACE
========================================================= */

function normalizeSettings(rawSettings) {

    const defaults =
        createDefaultSettings();


    if (
        !rawSettings ||
        typeof rawSettings !== "object"
    ) {

        return defaults;
    }


    return {

        musicEnabled:
            typeof rawSettings.musicEnabled ===
                "boolean"
                ? rawSettings.musicEnabled
                : defaults.musicEnabled
    };
}


/* =========================================================
   NAČTENÍ
========================================================= */

function loadSettings() {

    try {

        const raw =
            localStorage.getItem(
                GAME_CONFIG
                    .storage
                    .settingsKey
            );


        if (!raw) {

            return createDefaultSettings();
        }


        const parsed =
            JSON.parse(raw);


        return normalizeSettings(
            parsed
        );

    } catch (error) {

        console.error(
            "Nepodařilo se načíst nastavení DOTS UNO.",
            error
        );


        return createDefaultSettings();
    }
}


/* =========================================================
   ULOŽENÍ
========================================================= */

function saveSettings(settings) {

    const normalized =
        normalizeSettings(
            settings
        );


    try {

        localStorage.setItem(
            GAME_CONFIG
                .storage
                .settingsKey,

            JSON.stringify(
                normalized
            )
        );

    } catch (error) {

        console.error(
            "Nepodařilo se uložit nastavení DOTS UNO.",
            error
        );
    }


    return normalized;
}


/* =========================================================
   AKTUALIZACE JEDNÉ HODNOTY
========================================================= */

function updateSetting(
    key,
    value
) {

    const settings =
        loadSettings();


    settings[key] =
        value;


    return saveSettings(
        settings
    );
}


/* =========================================================
   HUDBA
========================================================= */

function isMusicEnabled() {

    return loadSettings()
        .musicEnabled;
}


function setMusicEnabled(
    enabled
) {

    const value =
        Boolean(enabled);


    updateSetting(
        "musicEnabled",
        value
    );


    /*
        UI i hudební systém se mohou na změnu
        nastavení napojit přes tento event.
    */

    window.dispatchEvent(
        new CustomEvent(
            "dotsuno:music-setting-changed",
            {
                detail: {
                    enabled:
                        value
                }
            }
        )
    );


    return value;
}


function toggleMusicEnabled() {

    return setMusicEnabled(
        !isMusicEnabled()
    );
}


/* =========================================================
   RESET NASTAVENÍ PRO DEBUG
========================================================= */

function resetSettings() {

    const settings =
        createDefaultSettings();


    saveSettings(
        settings
    );


    window.dispatchEvent(
        new CustomEvent(
            "dotsuno:music-setting-changed",
            {
                detail: {
                    enabled:
                        settings.musicEnabled
                }
            }
        )
    );


    return settings;
}
