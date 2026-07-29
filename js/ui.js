"use strict";


/* =========================================================
   DOTS UNO
   UI VRSTVA
========================================================= */


const UI_STATE = {

    currentScreen:
        "screen-menu",

    selectedSlotIndex:
        null,

    selectedCharacterId:
        null,

    selectedSkinId:
        null,

    existingSlotSkinId:
        null,

    selectedCardIds:
        new Set(),

    pendingPlayCardIds:
        null,

    colorChoiceMinimized:
        false,

    openingSpeechActive:
        false,

    firstPlayerActionDone:
        false,

    drag: {

        active:
            false,

        pointerId:
            null,

        cardId:
            null,

        startX:
            0,

        startY:
            0,

        currentX:
            0,

        currentY:
            0,

        moved:
            false,

        elements:
            []
    },

    lukySpeechTimer:
        null,

    playerSpeechTimer:
        null,

    speechSequenceToken:
        0,

    activeLukyEmote:
        false,

    activePlayerEmote:
        false,

    toastTimer:
        null,

    historyOpen:
        false,

    youtubeReady:
        false,

    youtubePlayer:
        null,

    musicPlaying:
        false,

    activeMusicTrack:
        null
};


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeUI
);


function initializeUI() {

    setupNavigation();

    setupCharacterSelection();

    setupSkinSelection();

    setupSlotActions();

    setupGameControls();

    setupModalControls();

    setupHistoryControls();

    setupMusicControls();

    setupGameEvents();

    setupStaticImageFallbacks();

    renderMusicSetting();

    renderMainMenuStats();

    renderSaveSlots();

    showScreen(
        "screen-menu"
    );
}


/* =========================================================
   OBRAZOVKY
========================================================= */

function showScreen(screenId) {

    document
        .querySelectorAll(".screen")
        .forEach(
            (screen) => {

                screen.hidden =
                    screen.id !==
                    screenId;
            }
        );


    UI_STATE.currentScreen =
        screenId;


    if (
        screenId !==
        "screen-game"
    ) {

        closeHistory();
    }


    window.scrollTo({
        top:
            0,

        behavior:
            "auto"
    });
}


/* =========================================================
   NAVIGACE
========================================================= */

function setupNavigation() {

    document
        .getElementById(
            "open-slots-button"
        )
        ?.addEventListener(
            "click",
            () => {

                renderSaveSlots();

                showScreen(
                    "screen-slots"
                );
            }
        );


    document
        .getElementById(
            "open-achievements-button"
        )
        ?.addEventListener(
            "click",
            () => {

                renderAchievements();

                showScreen(
                    "screen-achievements"
                );
            }
        );


    document
        .querySelectorAll(
            "[data-go-screen]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const target =
                            button.dataset
                                .goScreen;


                        if (!target) {
                            return;
                        }


                        if (
                            target ===
                            "screen-menu"
                        ) {

                            renderMainMenuStats();

                            renderMusicSetting();
                        }


                        if (
                            target ===
                            "screen-slots"
                        ) {

                            renderSaveSlots();
                        }


                        showScreen(
                            target
                        );
                    }
                );
            }
        );


    document
        .getElementById(
            "character-select-back"
        )
        ?.addEventListener(
            "click",
            () => {

                clearNewCharacterSelection();

                renderSaveSlots();

                showScreen(
                    "screen-slots"
                );
            }
        );


    document
        .getElementById(
            "skin-select-back"
        )
        ?.addEventListener(
            "click",
            () => {

                const slotIndex =
                    UI_STATE
                        .selectedSlotIndex;


                if (
                    slotIndex ===
                    null
                ) {

                    renderSaveSlots();

                    showScreen(
                        "screen-slots"
                    );

                    return;
                }


                openSlotActions(
                    slotIndex
                );
            }
        );
}


/* =========================================================
   HLAVNÍ MENU
========================================================= */

function renderMainMenuStats() {

    const stats =
        getAchievementStats();


    setText(
        "global-player-wins",
        stats.totalWins
    );


    setText(
        "global-luky-wins",
        stats.totalLosses
    );
}


/* =========================================================
   SAVE SLOTY
========================================================= */

function renderSaveSlots() {

    const container =
        document.getElementById(
            "save-slots"
        );


    const template =
        document.getElementById(
            "save-slot-template"
        );


    if (
        !container ||
        !template
    ) {
        return;
    }


    container.innerHTML =
        "";


    const slots =
        loadSaveSlots();


    slots.forEach(
        (slot, index) => {

            const fragment =
                template.content
                    .cloneNode(true);


            const button =
                fragment.querySelector(
                    ".save-slot"
                );


            const number =
                fragment.querySelector(
                    ".save-slot-number"
                );


            const title =
                fragment.querySelector(
                    ".save-slot-title"
                );


            const record =
                fragment.querySelector(
                    ".save-slot-record"
                );


            number.textContent =
                String(
                    index + 1
                );


            if (
                isSaveSlotEmpty(
                    slot
                )
            ) {

                title.textContent =
                    "Nová hra";


                record.hidden =
                    true;

            } else {

                title.textContent =
                    getCharacterName(
                        slot.characterId
                    );


                record.textContent =
                    getSlotRecordText(
                        slot
                    );


                record.hidden =
                    false;
            }


            button.addEventListener(
                "click",
                () => {

                    handleSlotClick(
                        index
                    );
                }
            );


            container.appendChild(
                fragment
            );
        }
    );
}


function handleSlotClick(
    slotIndex
) {

    const slot =
        getSaveSlot(
            slotIndex
        );


    UI_STATE.selectedSlotIndex =
        slotIndex;


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
    ) {

        openCharacterSelection(
            slotIndex
        );

        return;
    }


    openSlotActions(
        slotIndex
    );
}


/* =========================================================
   SLOT ACTIONS
========================================================= */

function openSlotActions(
    slotIndex
) {

    const slot =
        getSaveSlot(
            slotIndex
        );


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
    ) {

        renderSaveSlots();

        showScreen(
            "screen-slots"
        );

        return;
    }


    UI_STATE.selectedSlotIndex =
        slotIndex;


    setText(
        "slot-actions-character",
        getCharacterName(
            slot.characterId
        )
    );


    setText(
        "slot-summary-record",
        getSlotRecordText(
            slot
        )
    );


    const skin =
        getSlotSkin(
            slot
        );


    setText(
        "slot-summary-skin",
        skin?.name
            ? `Vzhled: ${skin.name}`
            : "Výchozí vzhled"
    );


    setText(
        "slot-summary-status",
        hasActiveGame(
            slot
        )
            ? "Rozehraná partie"
            : "Bez rozehrané partie"
    );


    setImageWithFallback({
        imageId:
            "slot-summary-image",

        fallbackId:
            "slot-summary-avatar",

        src:
            getSlotCharacterImage(
                slot
            ),

        fallback:
            getCharacterConfig(
                slot.characterId
            )?.fallback ||
            "?"
    });


    const continueButton =
        document.getElementById(
            "continue-game-button"
        );


    if (continueButton) {

        continueButton.hidden =
            !hasActiveGame(
                slot
            );
    }


    showScreen(
        "screen-slot-actions"
    );
}


function setupSlotActions() {

    document
        .getElementById(
            "continue-game-button"
        )
        ?.addEventListener(
            "click",
            () => {

                const slotIndex =
                    UI_STATE
                        .selectedSlotIndex;


                if (
                    slotIndex ===
                    null
                ) {
                    return;
                }


                startGameUI(
                    slotIndex,
                    true
                );
            }
        );


    document
        .getElementById(
            "start-next-game-button"
        )
        ?.addEventListener(
            "click",
            () => {

                const slotIndex =
                    UI_STATE
                        .selectedSlotIndex;


                if (
                    slotIndex ===
                    null
                ) {
                    return;
                }


                clearCurrentGame(
                    slotIndex
                );


                startGameUI(
                    slotIndex,
                    false
                );
            }
        );


    document
        .getElementById(
            "change-skin-button"
        )
        ?.addEventListener(
            "click",
            () => {

                const slotIndex =
                    UI_STATE
                        .selectedSlotIndex;


                if (
                    slotIndex ===
                    null
                ) {
                    return;
                }


                openExistingSkinSelection(
                    slotIndex
                );
            }
        );


    document
        .getElementById(
            "reset-slot-button"
        )
        ?.addEventListener(
            "click",
            () => {

                openModal(
                    "modal-reset-slot"
                );
            }
        );
}


/* =========================================================
   POSTAVY
========================================================= */

function setupCharacterSelection() {

    document
        .querySelectorAll(
            ".character-card"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        selectCharacter(
                            button.dataset
                                .character
                        );
                    }
                );
            }
        );


    document
        .getElementById(
            "change-character-button"
        )
        ?.addEventListener(
            "click",
            clearNewCharacterSelection
        );


    document
        .getElementById(
            "confirm-character-button"
        )
        ?.addEventListener(
            "click",
            confirmNewCharacter
        );
}


function openCharacterSelection(
    slotIndex
) {

    UI_STATE.selectedSlotIndex =
        slotIndex;


    clearNewCharacterSelection();

    updateRecommendedCharacter();


    showScreen(
        "screen-character-select"
    );
}


function updateRecommendedCharacter() {

    const card =
        document.querySelector(
            '[data-character="96"]'
        );


    const badge =
        card?.querySelector(
            ".recommended-badge"
        );


    if (
        !card ||
        !badge
    ) {
        return;
    }


    badge.hidden =
        !GAME_CONFIG
            .characterSelection
            .showRecommendation;


    card.classList.toggle(
        "is-first-recommendation",
        isFirstCharacterSelection()
    );
}


function selectCharacter(
    characterId
) {

    const character =
        getCharacterConfig(
            characterId
        );


    if (!character) {
        return;
    }


    UI_STATE.selectedCharacterId =
        characterId;


    UI_STATE.selectedSkinId =
        character.defaultSkinId ||
        "default";


    document
        .querySelectorAll(
            ".character-card"
        )
        .forEach(
            (card) => {

                card.classList.toggle(
                    "is-selected",
                    card.dataset
                        .character ===
                    characterId
                );
            }
        );


    setText(
        "skin-selection-title",
        character.name
    );


    renderNewCharacterSkinGrid();


    const section =
        document.getElementById(
            "skin-selection"
        );


    if (section) {

        section.hidden =
            false;
    }


    updateConfirmCharacterButton();


    section?.scrollIntoView({
        behavior:
            "smooth",

        block:
            "nearest"
    });
}


function renderNewCharacterSkinGrid() {

    const characterId =
        UI_STATE
            .selectedCharacterId;


    if (!characterId) {
        return;
    }


    renderSkinGrid({
        characterId,

        containerId:
            "skin-grid",

        selectedSkinId:
            UI_STATE
                .selectedSkinId,

        onSelect:
            (skinId) => {

                UI_STATE.selectedSkinId =
                    skinId;


                renderNewCharacterSkinGrid();

                updateConfirmCharacterButton();
            }
    });
}


function updateConfirmCharacterButton() {

    const button =
        document.getElementById(
            "confirm-character-button"
        );


    if (!button) {
        return;
    }


    button.disabled =
        !UI_STATE.selectedCharacterId ||
        !UI_STATE.selectedSkinId ||
        !isSkinUnlocked(
            UI_STATE.selectedCharacterId,
            UI_STATE.selectedSkinId
        );
}


function clearNewCharacterSelection() {

    UI_STATE.selectedCharacterId =
        null;


    UI_STATE.selectedSkinId =
        null;


    document
        .querySelectorAll(
            ".character-card"
        )
        .forEach(
            (card) => {

                card.classList.remove(
                    "is-selected"
                );
            }
        );


    const section =
        document.getElementById(
            "skin-selection"
        );


    if (section) {

        section.hidden =
            true;
    }


    const grid =
        document.getElementById(
            "skin-grid"
        );


    if (grid) {

        grid.innerHTML =
            "";
    }


    updateConfirmCharacterButton();
}


function confirmNewCharacter() {

    const slotIndex =
        UI_STATE
            .selectedSlotIndex;


    const characterId =
        UI_STATE
            .selectedCharacterId;


    const skinId =
        UI_STATE
            .selectedSkinId;


    if (
        slotIndex ===
            null ||
        !characterId ||
        !skinId
    ) {
        return;
    }


    if (
        !isSkinUnlocked(
            characterId,
            skinId
        )
    ) {
        return;
    }


    initializeSlot(
        slotIndex,
        characterId,
        skinId
    );


    clearNewCharacterSelection();


    startGameUI(
        slotIndex,
        false
    );
}


/* =========================================================
   SKINY
========================================================= */

function setupSkinSelection() {

    document
        .getElementById(
            "save-skin-button"
        )
        ?.addEventListener(
            "click",
            () => {

                const slotIndex =
                    UI_STATE
                        .selectedSlotIndex;


                const skinId =
                    UI_STATE
                        .existingSlotSkinId;


                if (
                    slotIndex ===
                        null ||
                    !skinId
                ) {
                    return;
                }


                const slot =
                    getSaveSlot(
                        slotIndex
                    );


                if (!slot) {
                    return;
                }


                if (
                    !isSkinUnlocked(
                        slot.characterId,
                        skinId
                    )
                ) {
                    return;
                }


                setSlotSkin(
                    slotIndex,
                    skinId
                );


                openSlotActions(
                    slotIndex
                );
            }
        );
}


function openExistingSkinSelection(
    slotIndex
) {

    const slot =
        getSaveSlot(
            slotIndex
        );


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
    ) {
        return;
    }


    UI_STATE.selectedSlotIndex =
        slotIndex;


    UI_STATE.existingSlotSkinId =
        slot.skinId ||
        "default";


    setText(
        "existing-skin-title",
        `Vyber skin – ${getCharacterName(slot.characterId)}`
    );


    renderExistingSkinGrid();

    updateSaveSkinButton();


    showScreen(
        "screen-skin-select"
    );
}


function renderExistingSkinGrid() {

    const slotIndex =
        UI_STATE
            .selectedSlotIndex;


    if (
        slotIndex ===
        null
    ) {
        return;
    }


    const slot =
        getSaveSlot(
            slotIndex
        );


    if (!slot) {
        return;
    }


    renderSkinGrid({
        characterId:
            slot.characterId,

        containerId:
            "existing-skin-grid",

        selectedSkinId:
            UI_STATE
                .existingSlotSkinId,

        onSelect:
            (skinId) => {

                UI_STATE.existingSlotSkinId =
                    skinId;


                renderExistingSkinGrid();

                updateSaveSkinButton();
            }
    });
}


function updateSaveSkinButton() {

    const button =
        document.getElementById(
            "save-skin-button"
        );


    if (!button) {
        return;
    }


    const slotIndex =
        UI_STATE
            .selectedSlotIndex;


    const skinId =
        UI_STATE
            .existingSlotSkinId;


    if (
        slotIndex ===
            null ||
        !skinId
    ) {

        button.disabled =
            true;

        return;
    }


    const slot =
        getSaveSlot(
            slotIndex
        );


    button.disabled =
        !slot ||
        !isSkinUnlocked(
            slot.characterId,
            skinId
        );
}


function renderSkinGrid({
    characterId,
    containerId,
    selectedSkinId,
    onSelect
}) {

    const container =
        document.getElementById(
            containerId
        );


    const template =
        document.getElementById(
            "skin-card-template"
        );


    if (
        !container ||
        !template
    ) {
        return;
    }


    container.innerHTML =
        "";


    const skins =
        getCharacterSkins(
            characterId
        );


    skins.forEach(
        (skin) => {

            const fragment =
                template.content
                    .cloneNode(true);


            const card =
                fragment.querySelector(
                    ".skin-card"
                );


            const image =
                fragment.querySelector(
                    ".skin-preview-image"
                );


            const lock =
                fragment.querySelector(
                    ".skin-lock-overlay"
                );


            const requirement =
                fragment.querySelector(
                    ".skin-lock-requirement"
                );


            const name =
                fragment.querySelector(
                    ".skin-card-name"
                );


            const status =
                fragment.querySelector(
                    ".skin-card-status"
                );


            const unlockInfo =
                getSkinUnlockInfo(
                    characterId,
                    skin.id
                );


            const unlocked =
                Boolean(
                    unlockInfo?.unlocked
                );


            image.src =
                skin.image;


            image.alt =
                `${getCharacterName(characterId)} – ${skin.name}`;


            name.textContent =
                skin.name;


            card.dataset.skinId =
                skin.id;


            card.classList.toggle(
                "is-selected",
                selectedSkinId ===
                    skin.id
            );


            card.classList.toggle(
                "is-locked",
                !unlocked
            );


            if (unlocked) {

                lock.hidden =
                    true;


                status.textContent =
                    selectedSkinId ===
                        skin.id
                        ? "Vybráno"
                        : "Odemčeno";


                card.addEventListener(
                    "click",
                    () => {

                        onSelect(
                            skin.id
                        );
                    }
                );

            } else {

                lock.hidden =
                    false;


                const achievement =
                    unlockInfo
                        ?.achievement;


                requirement.textContent =
                    achievement
                        ? `${achievement.title}: ${achievement.description}`
                        : "Skin je zamčený.";


                status.textContent =
                    "Zamčeno";
            }


            container.appendChild(
                fragment
            );
        }
    );
}


/* =========================================================
   ACHIEVEMENTY
========================================================= */

function renderAchievements() {

    const container =
        document.getElementById(
            "achievements-list"
        );


    const template =
        document.getElementById(
            "achievement-template"
        );


    if (
        !container ||
        !template
    ) {
        return;
    }


    container.innerHTML =
        "";


    const achievements =
        getAchievementViewData();


    achievements.forEach(
        (achievement) => {

            const fragment =
                template.content
                    .cloneNode(true);


            const card =
                fragment.querySelector(
                    ".achievement-card"
                );


            const icon =
                fragment.querySelector(
                    ".achievement-icon"
                );


            const image =
                fragment.querySelector(
                    ".achievement-image"
                );


            const cardPreview =
                fragment.querySelector(
                    ".achievement-card-preview"
                );


            const title =
                fragment.querySelector(
                    ".achievement-title"
                );


            const description =
                fragment.querySelector(
                    ".achievement-description"
                );


            const progress =
                fragment.querySelector(
                    ".achievement-progress"
                );


            const progressValue =
                fragment.querySelector(
                    ".achievement-progress-value"
                );


            const progressText =
                fragment.querySelector(
                    ".achievement-progress-text"
                );


            title.textContent =
                achievement.title;


            description.textContent =
                achievement.description;


            card.classList.toggle(
                "is-unlocked",
                achievement.unlocked
            );


            card.classList.toggle(
                "is-locked",
                !achievement.unlocked
            );


            if (
                achievement.image
            ) {

                icon.hidden =
                    true;


                image.hidden =
                    false;


                image.src =
                    achievement.image;


                image.alt =
                    achievement.title;

            } else if (
                achievement.cardPreview
            ) {

                icon.hidden =
                    true;


                cardPreview.hidden =
                    false;


                cardPreview.innerHTML =
                    "";


                const preview =
                    createAchievementCardPreview(
                        achievement.cardPreview
                    );


                if (preview) {

                    cardPreview.appendChild(
                        preview
                    );
                }

            } else {

                icon.hidden =
                    false;
            }


            if (
                achievement.target >
                1
            ) {

                progress.hidden =
                    false;


                const percent =
                    Math.min(
                        100,
                        (
                            achievement.current /
                            achievement.target
                        ) *
                        100
                    );


                progressValue.style.width =
                    `${percent}%`;


                progressText.textContent =
                    `${achievement.current} / ${achievement.target}`;

            } else {

                progress.hidden =
                    true;
            }


            container.appendChild(
                fragment
            );
        }
    );
}


function createAchievementCardPreview(
    preview
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "game-card";


    element.dataset.color =
        preview.color ||
        "yellow";


    const cornerTop =
        document.createElement(
            "span"
        );


    cornerTop.className =
        "card-corner card-corner-top";


    const cornerTopValue =
        document.createElement(
            "span"
        );


    cornerTopValue.className =
        "card-corner-value";


    cornerTopValue.textContent =
        String(
            preview.value ??
            ""
        );


    cornerTop.appendChild(
        cornerTopValue
    );


    const center =
        document.createElement(
            "span"
        );


    center.className =
        "card-center";


    const centerValue =
        document.createElement(
            "span"
        );


    centerValue.className =
        "card-center-value";


    centerValue.textContent =
        String(
            preview.value ??
            ""
        );


    center.appendChild(
        centerValue
    );


    const cornerBottom =
        cornerTop.cloneNode(
            true
        );


    cornerBottom.className =
        "card-corner card-corner-bottom";


    element.append(
        cornerTop,
        center,
        cornerBottom
    );


    return element;
}


/* =========================================================
   GAME START
========================================================= */

function startGameUI(
    slotIndex,
    continueGame
) {

    UI_STATE.selectedSlotIndex =
        slotIndex;


    UI_STATE.selectedCardIds.clear();

    UI_STATE.pendingPlayCardIds =
        null;

    UI_STATE.colorChoiceMinimized =
        false;

    UI_STATE.firstPlayerActionDone =
        false;

    resetSpeechUI();

    resetEmoteUI();

    closeHistory();

    closeModal();


    showScreen(
        "screen-game"
    );


    try {

        if (continueGame) {

            continueSavedGame(
                slotIndex
            );

        } else {

            startNewGame(
                slotIndex
            );
        }

    } catch (error) {

        console.error(
            error
        );


        showToast(
            "Chyba",
            "Hru se nepodařilo spustit."
        );


        renderSaveSlots();


        showScreen(
            "screen-slots"
        );


        return;
    }


    renderGame();


    startMusicForGame();
}


/* =========================================================
   GAME CONTROLS
========================================================= */

function setupGameControls() {

    document
        .getElementById(
            "draw-pile"
        )
        ?.addEventListener(
            "click",
            () => {

                markFirstPlayerAction();


                const state =
                    getGameState();


                if (
                    state?.skipChainCount >
                        0 &&
                    state.turn ===
                        "player"
                ) {

                    showToast(
                        "Stůj",
                        "Musíš přehodit Stůj, nebo zvolit „Stojím“."
                    );


                    return;
                }


                playerDraw();
            }
        );


    document
        .getElementById(
            "discard-zone"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    UI_STATE
                        .selectedCardIds
                        .size >
                    0
                ) {

                    markFirstPlayerAction();

                    attemptSelectedCardPlay();

                    return;
                }


                openHistory();
            }
        );


    document
        .getElementById(
            "uno-button"
        )
        ?.addEventListener(
            "click",
            () => {

                markFirstPlayerAction();

                playerCallUno();
            }
        );


    document
        .getElementById(
            "catch-uno-button"
        )
        ?.addEventListener(
            "click",
            () => {

                playerCatchLukyUno();
            }
        );


    document
        .getElementById(
            "accept-skip-button"
        )
        ?.addEventListener(
            "click",
            () => {

                markFirstPlayerAction();


                UI_STATE
                    .selectedCardIds
                    .clear();


                playerAcceptSkip();
            }
        );


    document
        .getElementById(
            "ask-yellow-button"
        )
        ?.addEventListener(
            "click",
            askLukyAboutYellow
        );


    document
        .getElementById(
            "game-menu-button"
        )
        ?.addEventListener(
            "click",
            () => {

                pauseGame();


                openModal(
                    "modal-game-menu"
                );
            }
        );


    document
        .getElementById(
            "resume-game-button"
        )
        ?.addEventListener(
            "click",
            () => {

                closeModal();

                resumeGame();
            }
        );


    document
        .getElementById(
            "save-and-menu-button"
        )
        ?.addEventListener(
            "click",
            () => {

                saveAndLeaveGame();

                stopMusic();

                closeModal();

                renderMainMenuStats();

                renderMusicSetting();

                showScreen(
                    "screen-menu"
                );
            }
        );


    document
        .getElementById(
            "play-again-button"
        )
        ?.addEventListener(
            "click",
            () => {

                const slotIndex =
                    UI_STATE
                        .selectedSlotIndex;


                closeModal();


                if (
                    slotIndex ===
                    null
                ) {
                    return;
                }


                startGameUI(
                    slotIndex,
                    false
                );
            }
        );


    document
        .getElementById(
            "game-over-menu-button"
        )
        ?.addEventListener(
            "click",
            () => {

                stopMusic();

                closeModal();

                renderMainMenuStats();

                renderMusicSetting();

                showScreen(
                    "screen-menu"
                );
            }
        );
}


/* =========================================================
   GAME RENDER
========================================================= */

function renderGame() {

    const state =
        getGameState();


    const slotIndex =
        getActiveSlotIndex();


    if (
        !state ||
        slotIndex ===
            null
    ) {
        return;
    }


    const slot =
        getSaveSlot(
            slotIndex
        );


    if (!slot) {
        return;
    }


    sanitizeSelectedCards(
        state.playerHand
    );


    renderGameProfiles(
        slot,
        state
    );


    renderPlayerHand(
        state
    );


    renderLukyHand(
        state
    );


    renderDiscardPile(
        state
    );


    renderGameIndicators(
        state
    );


    renderGameControls(
        state
    );


    renderYellowEvent(
        state
    );


    renderGameStatus(
        state
    );


    renderLastAction(
        state
    );


    renderHistory(
        state
    );


    updateDiscardPlayTarget();

    updateMusicButton();
}


/* =========================================================
   PROFILY
========================================================= */

function renderGameProfiles(
    slot,
    state
) {

    const character =
        getCharacterConfig(
            slot.characterId
        );


    setText(
        "game-character-name",
        character?.name ||
        ""
    );


    setText(
        "player-name",
        character?.name ||
        ""
    );


    setText(
        "game-slot-score",
        getSlotRecordText(
            slot
        )
    );


    setText(
        "player-card-count",
        formatCardCount(
            state.playerHand.length
        )
    );


    setText(
        "luky-card-count",
        formatCardCount(
            state.lukyHand.length
        )
    );


    if (
        !UI_STATE
            .activePlayerEmote
    ) {

        setImageWithFallback({
            imageId:
                "player-avatar",

            fallbackId:
                "player-avatar-fallback",

            src:
                getSlotCharacterImage(
                    slot
                ),

            fallback:
                character?.fallback ||
                "?"
        });
    }


    if (
        !UI_STATE
            .activeLukyEmote
    ) {

        setImageWithFallback({
            imageId:
                "luky-photo",

            fallbackId:
                "luky-photo-fallback",

            src:
                GAME_CONFIG
                    .opponent
                    .defaultImage,

            fallback:
                GAME_CONFIG
                    .opponent
                    .fallback
        });
    }
}


/* =========================================================
   GAME CONTROLS STATE
========================================================= */

function renderGameControls(
    state
) {

    const acceptSkip =
        document.getElementById(
            "accept-skip-button"
        );


    if (acceptSkip) {

        acceptSkip.hidden =
            !(
                state.status ===
                    "playing" &&
                state.turn ===
                    "player" &&
                state.skipChainCount >
                    0
            );
    }


    const drawPile =
        document.getElementById(
            "draw-pile"
        );


    if (drawPile) {

        drawPile.disabled =
            state.status !==
                "playing" ||
            state.turn !==
                "player" ||
            state.skipChainCount >
                0 ||
            UI_STATE.pendingPlayCardIds !==
                null;


        drawPile.setAttribute(
            "aria-disabled",
            String(
                drawPile.disabled
            )
        );
    }
}


/* =========================================================
   PLAYER HAND
========================================================= */

function renderPlayerHand(
    state
) {

    const container =
        document.getElementById(
            "player-hand"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const hand =
        sortHand(
            state.playerHand
        );


    const interactive =
        state.status ===
            "playing" &&
        state.turn ===
            "player" &&
        !GAME_RUNTIME.paused;


    container.classList.toggle(
        "is-disabled",
        !interactive
    );


    hand.forEach(
        (card) => {

            const element =
                createCardElement(
                    card
                );


            const selected =
                UI_STATE
                    .selectedCardIds
                    .has(
                        card.id
                    );


            element.classList.toggle(
                "is-selected",
                selected
            );


            element.classList.toggle(
                "is-same-card-option",
                shouldHighlightIdenticalCard(
                    card,
                    hand
                ) &&
                !selected
            );


            element.disabled =
                !interactive;


            element.addEventListener(
                "click",
                () => {

                    handleCardClick(
                        card
                    );
                }
            );


            element.addEventListener(
                "pointerdown",
                (event) => {

                    beginCardDrag(
                        event,
                        card
                    );
                }
            );


            container.appendChild(
                element
            );
        }
    );
}


/* =========================================================
   LUKY HAND
========================================================= */

function renderLukyHand(
    state
) {

    const container =
        document.getElementById(
            "luky-hand"
        );


    const template =
        document.getElementById(
            "card-back-template"
        );


    if (
        !container ||
        !template
    ) {
        return;
    }


    container.innerHTML =
        "";


    state.lukyHand.forEach(
        () => {

            const fragment =
                template.content
                    .cloneNode(true);


            container.appendChild(
                fragment
            );
        }
    );
}


/* =========================================================
   DISCARD
========================================================= */

function renderDiscardPile(
    state
) {

    const container =
        document.getElementById(
            "discard-pile"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const card =
        state.discardPile[
            state.discardPile.length -
            1
        ];


    if (!card) {
        return;
    }


    const element =
        createCardElement(
            card
        );


    element.disabled =
        true;


    container.appendChild(
        element
    );
}


/* =========================================================
   CARD ELEMENT
========================================================= */

function createCardElement(
    card
) {

    const template =
        document.getElementById(
            "card-template"
        );


    if (!template) {

        throw new Error(
            "Chybí card-template."
        );
    }


    const fragment =
        template.content
            .cloneNode(true);


    const element =
        fragment.querySelector(
            ".game-card"
        );


    const corners =
        fragment.querySelectorAll(
            ".card-corner-value"
        );


    const center =
        fragment.querySelector(
            ".card-center-value"
        );


    const display =
        getCardDisplayValue(
            card
        );


    element.dataset.cardId =
        card.id;


    element.dataset.color =
        card.color;


    element.dataset.type =
        card.type;


    if (
        isWildCard(
            card
        )
    ) {

        element.classList.add(
            "is-wild"
        );
    }


    element.setAttribute(
        "aria-label",
        getCardDescription(
            card
        )
    );


    corners.forEach(
        (corner) => {

            corner.textContent =
                display;
        }
    );


    center.textContent =
        display;


    return element;
}


/* =========================================================
   CARD SELECT
========================================================= */

function handleCardClick(
    card
) {

    const state =
        getGameState();


    if (
        !state ||
        state.status !==
            "playing" ||
        state.turn !==
            "player"
    ) {
        return;
    }


    const selected =
        UI_STATE
            .selectedCardIds;


    if (
        selected.has(
            card.id
        )
    ) {

        selected.delete(
            card.id
        );


        renderPlayerHand(
            state
        );


        updateDiscardPlayTarget();

        return;
    }


    if (
        selected.size ===
        0
    ) {

        selected.add(
            card.id
        );


        renderPlayerHand(
            state
        );


        updateDiscardPlayTarget();

        return;
    }


    const firstId =
        [...selected][0];


    const firstCard =
        state.playerHand.find(
            (item) =>
                item.id ===
                firstId
        );


    if (
        firstCard &&
        areCardsIdentical(
            firstCard,
            card
        )
    ) {

        selected.add(
            card.id
        );

    } else {

        selected.clear();

        selected.add(
            card.id
        );
    }


    renderPlayerHand(
        state
    );


    updateDiscardPlayTarget();
}


/* =========================================================
   KUŘ! HIGHLIGHT
========================================================= */

function shouldHighlightIdenticalCard(
    card,
    hand
) {

    const selected =
        UI_STATE
            .selectedCardIds;


    if (
        selected.size ===
            0 ||
        selected.has(
            card.id
        )
    ) {
        return false;
    }


    const firstId =
        [...selected][0];


    const firstCard =
        hand.find(
            (item) =>
                item.id ===
                firstId
        );


    return Boolean(
        firstCard &&
        areCardsIdentical(
            firstCard,
            card
        )
    );
}


function sanitizeSelectedCards(
    hand
) {

    const validIds =
        new Set(
            hand.map(
                (card) =>
                    card.id
            )
        );


    [
        ...UI_STATE
            .selectedCardIds
    ].forEach(
        (id) => {

            if (
                !validIds.has(
                    id
                )
            ) {

                UI_STATE
                    .selectedCardIds
                    .delete(
                        id
                    );
            }
        }
    );
}


/* =========================================================
   DISCARD TARGET
========================================================= */

function updateDiscardPlayTarget() {

    const zone =
        document.getElementById(
            "discard-zone"
        );


    if (!zone) {
        return;
    }


    zone.classList.toggle(
        "is-play-target",
        UI_STATE
            .selectedCardIds
            .size >
        0
    );
}


/* =========================================================
   DRAG
========================================================= */

function beginCardDrag(
    event,
    card
) {

    if (
        event.button !==
            undefined &&
        event.button !==
            0
    ) {
        return;
    }


    const state =
        getGameState();


    if (
        !state ||
        state.status !==
            "playing" ||
        state.turn !==
            "player"
    ) {
        return;
    }


    if (
        !UI_STATE
            .selectedCardIds
            .has(
                card.id
            )
    ) {

        const firstId =
            [
                ...UI_STATE
                    .selectedCardIds
            ][0];


        const firstCard =
            state.playerHand.find(
                (item) =>
                    item.id ===
                    firstId
            );


        if (
            firstCard &&
            areCardsIdentical(
                firstCard,
                card
            )
        ) {

            UI_STATE
                .selectedCardIds
                .add(
                    card.id
                );

        } else {

            UI_STATE
                .selectedCardIds
                .clear();


            UI_STATE
                .selectedCardIds
                .add(
                    card.id
                );
        }


        renderPlayerHand(
            state
        );
    }


    const selectedElements =
        [
            ...UI_STATE
                .selectedCardIds
        ]
            .map(
                (id) =>
                    document.querySelector(
                        `[data-card-id="${CSS.escape(id)}"]`
                    )
            )
            .filter(
                Boolean
            );


    UI_STATE.drag = {

        active:
            true,

        pointerId:
            event.pointerId,

        cardId:
            card.id,

        startX:
            event.clientX,

        startY:
            event.clientY,

        currentX:
            event.clientX,

        currentY:
            event.clientY,

        moved:
            false,

        elements:
            selectedElements
    };


    selectedElements.forEach(
        (element) => {

            element.classList.add(
                "is-dragging"
            );
        }
    );


    event.currentTarget
        ?.setPointerCapture?.(
            event.pointerId
        );


    window.addEventListener(
        "pointermove",
        handleCardDragMove
    );


    window.addEventListener(
        "pointerup",
        endCardDrag,
        {
            once:
                true
        }
    );


    window.addEventListener(
        "pointercancel",
        cancelCardDrag,
        {
            once:
                true
        }
    );
}


function handleCardDragMove(
    event
) {

    const drag =
        UI_STATE.drag;


    if (
        !drag.active ||
        event.pointerId !==
            drag.pointerId
    ) {
        return;
    }


    drag.currentX =
        event.clientX;


    drag.currentY =
        event.clientY;


    const deltaX =
        event.clientX -
        drag.startX;


    const deltaY =
        event.clientY -
        drag.startY;


    const distance =
        Math.sqrt(
            deltaX * deltaX +
            deltaY * deltaY
        );


    if (
        distance >
        GAME_CONFIG
            .cardInteraction
            .clickMovementTolerancePx
    ) {

        drag.moved =
            true;
    }


    drag.elements.forEach(
        (element) => {

            element.style.transform =
                `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
        }
    );


    updateDropZoneState(
        event.clientX,
        event.clientY
    );
}


function endCardDrag(
    event
) {

    const drag =
        UI_STATE.drag;


    if (
        !drag.active ||
        event.pointerId !==
            drag.pointerId
    ) {

        cleanupCardDrag();

        return;
    }


    const deltaY =
        event.clientY -
        drag.startY;


    const inDropZone =
        isPointInsideDropZone(
            event.clientX,
            event.clientY
        );


    const movedEnoughUp =
        deltaY <=
        -GAME_CONFIG
            .cardInteraction
            .dragPlayThresholdPx;


    const shouldPlay =
        inDropZone ||
        movedEnoughUp;


    cleanupCardDrag();


    if (shouldPlay) {

        markFirstPlayerAction();

        attemptSelectedCardPlay();
    }
}


function cancelCardDrag() {

    cleanupCardDrag();
}


function cleanupCardDrag() {

    UI_STATE.drag.elements
        .forEach(
            (element) => {

                element.classList.remove(
                    "is-dragging"
                );


                element.style.transform =
                    "";
            }
        );


    window.removeEventListener(
        "pointermove",
        handleCardDragMove
    );


    UI_STATE.drag.active =
        false;


    UI_STATE.drag.pointerId =
        null;


    UI_STATE.drag.elements =
        [];
}


function isPointInsideDropZone(
    x,
    y
) {

    const zone =
        document.getElementById(
            "discard-zone"
        );


    if (!zone) {
        return false;
    }


    const rect =
        zone.getBoundingClientRect();


    return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    );
}


function updateDropZoneState(
    x,
    y
) {

    const zone =
        document.getElementById(
            "discard-zone"
        );


    if (!zone) {
        return;
    }


    zone.classList.toggle(
        "is-play-target",
        isPointInsideDropZone(
            x,
            y
        )
    );
}


/* =========================================================
   PLAY SELECTED
========================================================= */

async function attemptSelectedCardPlay() {

    const ids =
        [
            ...UI_STATE
                .selectedCardIds
        ];


    if (
        ids.length ===
        0
    ) {
        return;
    }


    const validation =
        validatePlayerPlay(
            ids
        );


    if (
        !validation.valid
    ) {

        showToast(
            "Nelze zahrát",
            validation.message
        );


        return;
    }


    if (
        validation
            .needsColorChoice
    ) {

        UI_STATE.pendingPlayCardIds =
            ids;


        openColorChoice();

        return;
    }


    UI_STATE
        .selectedCardIds
        .clear();


    await playerPlayCards(
        ids
    );


    renderGame();
}


/* =========================================================
   INDIKÁTORY
========================================================= */

function renderGameIndicators(
    state
) {

    const penalty =
        document.getElementById(
            "draw-penalty-indicator"
        );


    if (penalty) {

        /*
            Penalizaci ukazujeme hlavně tehdy,
            když ji řeší hráč.

            Když hráč sám právě poslal +X Lukymu,
            nebude to působit jako akční tlačítko.
        */

        penalty.hidden =
            !(
                state.drawPenalty >
                    0 &&
                state.turn ===
                    "player"
            );
    }


    setText(
        "draw-penalty-value",
        `+${state.drawPenalty}`
    );


    const colorLabel =
        document.getElementById(
            "current-color-label"
        );


    if (colorLabel) {

        colorLabel.textContent =
            CARD_COLOR_LABELS[
                state.currentColor
            ] ||
            "—";


        colorLabel.dataset.color =
            state.currentColor ||
            "";


        colorLabel.classList.remove(
            "current-color-red",
            "current-color-yellow",
            "current-color-green",
            "current-color-blue"
        );


        if (
            state.currentColor
        ) {

            colorLabel.classList.add(
                `current-color-${state.currentColor}`
            );
        }
    }
}


/* =========================================================
   YELLOW EVENT
========================================================= */

function renderYellowEvent(
    state
) {

    const container =
        document.getElementById(
            "yellow-event"
        );


    if (!container) {
        return;
    }


    container.hidden =
        !state.yellowEventAvailable ||
        state.yellowEventUsed;
}


/* =========================================================
   STATUS
========================================================= */

function renderGameStatus(
    state
) {

    let text;


    if (
        state.status ===
        "finished"
    ) {

        text =
            "Partie skončila.";

    } else if (
        GAME_RUNTIME
            .pendingSevenChoice
    ) {

        text =
            "Rozhodni se, zda chceš Lukyho karty.";

    } else if (
        state.pendingPlayerUno
    ) {

        text =
            "Řekni UNO!";

    } else if (
        state.drawPenalty >
        0
    ) {

        text =
            state.turn ===
                "player"
                ? `Přehraj penalizaci +${state.drawPenalty}, nebo si vezmi karty.`
                : "Luky řeší penalizaci.";

    } else if (
        state.skipChainCount >
        0
    ) {

        text =
            state.turn ===
                "player"
                ? "Luky dal Stůj. Přehraj ho vlastním Stůj, nebo zvol „Stojím“."
                : "Luky řeší Stůj.";

    } else if (
        state.turn ===
        "player"
    ) {

        text =
            "Jsi na tahu.";

    } else {

        text =
            "Luky přemýšlí...";
    }


    setText(
        "game-status",
        text
    );
}


function renderLastAction(
    state
) {

    const element =
        document.getElementById(
            "last-action-text"
        );


    if (!element) {
        return;
    }


    const last =
        state.lastAction;


    if (!last?.text) {

        element.textContent =
            "";

        return;
    }


    element.textContent =
        last.text;
}


/* =========================================================
   MODALS
========================================================= */

function setupModalControls() {

    document
        .querySelectorAll(
            "[data-color-choice]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const color =
                            button.dataset
                                .colorChoice;


                        const ids =
                            UI_STATE
                                .pendingPlayCardIds;


                        if (
                            !ids ||
                            !isPlayableColor(
                                color
                            )
                        ) {
                            return;
                        }


                        UI_STATE.pendingPlayCardIds =
                            null;


                        UI_STATE.colorChoiceMinimized =
                            false;


                        UI_STATE
                            .selectedCardIds
                            .clear();


                        closeColorChoice();


                        await playerPlayCards(
                            ids,
                            color
                        );


                        renderGame();
                    }
                );
            }
        );


    document
        .getElementById(
            "hide-color-choice-button"
        )
        ?.addEventListener(
            "click",
            minimizeColorChoice
        );


    document
        .getElementById(
            "restore-color-choice-button"
        )
        ?.addEventListener(
            "click",
            restoreColorChoice
        );


    document
        .getElementById(
            "seven-swap-yes"
        )
        ?.addEventListener(
            "click",
            async () => {

                closeModal();


                await resolvePlayerSevenChoice(
                    true
                );
            }
        );


    document
        .getElementById(
            "seven-swap-no"
        )
        ?.addEventListener(
            "click",
            async () => {

                closeModal();


                await resolvePlayerSevenChoice(
                    false
                );
            }
        );


    document
        .getElementById(
            "confirm-reset-slot"
        )
        ?.addEventListener(
            "click",
            () => {

                const slotIndex =
                    UI_STATE
                        .selectedSlotIndex;


                if (
                    slotIndex ===
                    null
                ) {
                    return;
                }


                resetSaveSlot(
                    slotIndex
                );


                closeModal();


                openCharacterSelection(
                    slotIndex
                );
            }
        );


    document
        .getElementById(
            "cancel-reset-slot"
        )
        ?.addEventListener(
            "click",
            closeModal
        );
}


function openModal(
    modalId
) {

    const overlay =
        document.getElementById(
            "modal-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.hidden =
        false;


    overlay
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            (modal) => {

                modal.hidden =
                    modal.id !==
                    modalId;
            }
        );
}


function closeModal() {

    const overlay =
        document.getElementById(
            "modal-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.hidden =
        true;


    overlay
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            (modal) => {

                modal.hidden =
                    true;
            }
        );
}


/* =========================================================
   COLOR CHOICE
========================================================= */

function openColorChoice() {

    UI_STATE.colorChoiceMinimized =
        false;


    document
        .getElementById(
            "restore-color-choice-button"
        )
        ?.setAttribute(
            "hidden",
            ""
        );


    openModal(
        "modal-color"
    );
}


function minimizeColorChoice() {

    if (
        !UI_STATE
            .pendingPlayCardIds
    ) {
        return;
    }


    UI_STATE.colorChoiceMinimized =
        true;


    const overlay =
        document.getElementById(
            "modal-overlay"
        );


    if (overlay) {

        overlay.hidden =
            true;
    }


    const restore =
        document.getElementById(
            "restore-color-choice-button"
        );


    if (restore) {

        restore.hidden =
            false;
    }
}


function restoreColorChoice() {

    if (
        !UI_STATE
            .pendingPlayCardIds
    ) {
        return;
    }


    UI_STATE.colorChoiceMinimized =
        false;


    const restore =
        document.getElementById(
            "restore-color-choice-button"
        );


    if (restore) {

        restore.hidden =
            true;
    }


    openModal(
        "modal-color"
    );
}


function closeColorChoice() {

    UI_STATE.colorChoiceMinimized =
        false;


    const restore =
        document.getElementById(
            "restore-color-choice-button"
        );


    if (restore) {

        restore.hidden =
            true;
    }


    closeModal();
}


/* =========================================================
   HISTORY
========================================================= */

function setupHistoryControls() {

    document
        .getElementById(
            "history-button"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    UI_STATE.historyOpen
                ) {

                    closeHistory();

                } else {

                    openHistory();
                }
            }
        );


    document
        .getElementById(
            "history-close-button"
        )
        ?.addEventListener(
            "click",
            closeHistory
        );


    document
        .getElementById(
            "history-backdrop"
        )
        ?.addEventListener(
            "click",
            closeHistory
        );
}


function openHistory() {

    const panel =
        document.getElementById(
            "history-panel"
        );


    const backdrop =
        document.getElementById(
            "history-backdrop"
        );


    const button =
        document.getElementById(
            "history-button"
        );


    if (!panel) {
        return;
    }


    UI_STATE.historyOpen =
        true;


    panel.classList.add(
        "is-open"
    );


    panel.setAttribute(
        "aria-hidden",
        "false"
    );


    if (backdrop) {

        backdrop.hidden =
            false;
    }


    button?.setAttribute(
        "aria-expanded",
        "true"
    );


    renderHistory(
        getGameState()
    );
}


function closeHistory() {

    const panel =
        document.getElementById(
            "history-panel"
        );


    const backdrop =
        document.getElementById(
            "history-backdrop"
        );


    const button =
        document.getElementById(
            "history-button"
        );


    UI_STATE.historyOpen =
        false;


    panel?.classList.remove(
        "is-open"
    );


    panel?.setAttribute(
        "aria-hidden",
        "true"
    );


    if (backdrop) {

        backdrop.hidden =
            true;
    }


    button?.setAttribute(
        "aria-expanded",
        "false"
    );
}


function renderHistory(
    state
) {

    const container =
        document.getElementById(
            "history-list"
        );


    const template =
        document.getElementById(
            "history-entry-template"
        );


    if (
        !container ||
        !template
    ) {
        return;
    }


    const history =
        state?.history ||
        [];


    container.innerHTML =
        "";


    if (
        history.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "history-empty";


        empty.textContent =
            "Zatím se nic nestalo.";


        container.appendChild(
            empty
        );


        return;
    }


    const slot =
        getActiveSlotIndex() ===
            null
            ? null
            : getSaveSlot(
                getActiveSlotIndex()
            );


    history.forEach(
        (entry) => {

            const fragment =
                template.content
                    .cloneNode(true);


            const image =
                fragment.querySelector(
                    ".history-entry-avatar"
                );


            const fallback =
                fragment.querySelector(
                    ".history-entry-avatar-fallback"
                );


            const name =
                fragment.querySelector(
                    ".history-entry-name"
                );


            const time =
                fragment.querySelector(
                    ".history-entry-time"
                );


            const text =
                fragment.querySelector(
                    ".history-entry-text"
                );


            const cards =
                fragment.querySelector(
                    ".history-entry-cards"
                );


            const actorInfo =
                getHistoryActorInfo(
                    entry.actor,
                    slot
                );


            name.textContent =
                actorInfo.name;


            text.textContent =
                entry.text ||
                "";


            time.textContent =
                formatHistoryTime(
                    entry.timestamp
                );


            if (
                actorInfo.image
            ) {

                image.src =
                    actorInfo.image;


                image.alt =
                    actorInfo.name;


                image.hidden =
                    false;


                fallback.hidden =
                    true;


                image.onerror =
                    () => {

                        image.hidden =
                            true;


                        fallback.hidden =
                            false;


                        fallback.textContent =
                            actorInfo.fallback;
                    };

            } else {

                image.hidden =
                    true;


                fallback.hidden =
                    false;


                fallback.textContent =
                    actorInfo.fallback;
            }


            if (
                Array.isArray(
                    entry.cards
                ) &&
                entry.cards.length >
                    0
            ) {

                cards.hidden =
                    false;


                entry.cards.forEach(
                    (card) => {

                        const preview =
                            createHistoryCardElement(
                                card
                            );


                        if (preview) {

                            cards.appendChild(
                                preview
                            );
                        }
                    }
                );

            } else {

                cards.hidden =
                    true;
            }


            container.appendChild(
                fragment
            );
        }
    );
}


function getHistoryActorInfo(
    actor,
    slot
) {

    if (
        actor ===
        "luky"
    ) {

        return {

            name:
                "Luky",

            image:
                GAME_CONFIG
                    .opponent
                    .defaultImage,

            fallback:
                "L"
        };
    }


    if (
        actor ===
        "player"
    ) {

        return {

            name:
                getCharacterName(
                    slot?.characterId
                ) ||
                "Hráč",

            image:
                slot
                    ? getSlotCharacterImage(
                        slot
                    )
                    : null,

            fallback:
                getCharacterConfig(
                    slot?.characterId
                )?.fallback ||
                "H"
        };
    }


    return {

        name:
            "Hra",

        image:
            null,

        fallback:
            "•"
    };
}


function createHistoryCardElement(
    card
) {

    if (!card) {
        return null;
    }


    const fakeCard = {

        id:
            `history-${Math.random()}`,

        type:
            card.type,

        color:
            card.color,

        value:
            card.value
    };


    try {

        const element =
            createCardElement(
                fakeCard
            );


        element.disabled =
            true;


        return element;

    } catch {

        return null;
    }
}


function formatHistoryTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }


    const date =
        new Date(
            timestamp
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    return new Intl.DateTimeFormat(
        "cs-CZ",
        {
            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    ).format(
        date
    );
}


/* =========================================================
   GAME EVENTS
========================================================= */

function setupGameEvents() {

    const rerenderEvents = [
        "state-changed",
        "game-started",
        "game-loaded",
        "cards-played",
        "cards-drawn",
        "hands-swapped",
        "draw-stack-changed",
        "skip-chain-changed",
        "yellow-event-available",
        "history-changed"
    ];


    rerenderEvents.forEach(
        (name) => {

            window.addEventListener(
                `dotsuno:${name}`,
                () => {

                    renderGame();
                }
            );
        }
    );


    window.addEventListener(
        "dotsuno:hands-swapped",
        () => {

            UI_STATE
                .selectedCardIds
                .clear();
        }
    );


    window.addEventListener(
        "dotsuno:seven-choice-requested",
        () => {

            openModal(
                "modal-seven"
            );
        }
    );


    window.addEventListener(
        "dotsuno:invalid-action",
        (event) => {

            showToast(
                "Nelze provést",
                event.detail
                    ?.message ||
                "Tento tah není možný."
            );
        }
    );


    window.addEventListener(
        "dotsuno:luky-speech",
        (event) => {

            showLukySpeech(
                event.detail
                    ?.text,
                event.detail
                    ?.duration
            );
        }
    );


    window.addEventListener(
        "dotsuno:player-speech",
        (event) => {

            showPlayerSpeech(
                event.detail
                    ?.text,
                event.detail
                    ?.duration
            );
        }
    );


    window.addEventListener(
        "dotsuno:luky-opening-quote",
        (event) => {

            playOpeningQuote(
                event.detail
                    ?.quote
            );
        }
    );


    window.addEventListener(
        "dotsuno:luky-thinking-end",
        () => {

            const text =
                document.getElementById(
                    "luky-speech-text"
                );


            if (
                text?.textContent ===
                "..."
            ) {

                hideLukySpeech();
            }
        }
    );


    window.addEventListener(
        "dotsuno:emote-start",
        (event) => {

            startUIEmote(
                event.detail
            );
        }
    );


    window.addEventListener(
        "dotsuno:emote-end",
        (event) => {

            endUIEmote(
                event.detail
                    ?.actor
            );
        }
    );


    window.addEventListener(
        "dotsuno:achievement-unlocked",
        (event) => {

            const achievement =
                event.detail
                    ?.achievement;


            if (!achievement) {
                return;
            }


            showToast(
                "Achievement odemčen",
                achievement.title,
                3600
            );


            renderMainMenuStats();
        }
    );


    window.addEventListener(
        "dotsuno:player-missed-uno",
        (event) => {

            showToast(
                "Neřekl jsi UNO!",
                `Bereš ${event.detail?.penalty ?? 2} karty.`
            );
        }
    );


    window.addEventListener(
        "dotsuno:game-over",
        (event) => {

            stopMusic();


            showGameOver(
                event.detail
            );
        }
    );


    window.addEventListener(
        "dotsuno:game-left",
        stopMusic
    );
}


/* =========================================================
   OPENING SPEECH
========================================================= */

async function playOpeningQuote(
    quote
) {

    const normalized =
        normalizeQuote(
            quote
        );


    if (!normalized) {
        return;
    }


    const token =
        ++UI_STATE
            .speechSequenceToken;


    UI_STATE.openingSpeechActive =
        true;


    if (
        normalized.type ===
        "single"
    ) {

        showLukySpeech(
            normalized.text,
            GAME_CONFIG
                .speech
                .openingDurationMs
        );


        return;
    }


    for (
        const line of
        normalized.lines
    ) {

        if (
            token !==
            UI_STATE
                .speechSequenceToken ||
            !UI_STATE
                .openingSpeechActive
        ) {

            return;
        }


        showLukySpeech(
            line,
            GAME_CONFIG
                .speech
                .openingDurationMs
        );


        await uiSleep(
            Math.min(
                3200,
                GAME_CONFIG
                    .speech
                    .openingDurationMs
            )
        );
    }
}


function markFirstPlayerAction() {

    if (
        UI_STATE
            .firstPlayerActionDone
    ) {
        return;
    }


    UI_STATE.firstPlayerActionDone =
        true;


    UI_STATE.openingSpeechActive =
        false;


    UI_STATE.speechSequenceToken +=
        1;


    hideLukySpeech();
}


/* =========================================================
   SPEECH
========================================================= */

function showLukySpeech(
    text,
    duration =
        GAME_CONFIG
            .speech
            .defaultDurationMs
) {

    if (!text) {
        return;
    }


    const bubble =
        document.getElementById(
            "luky-speech"
        );


    const element =
        document.getElementById(
            "luky-speech-text"
        );


    if (
        !bubble ||
        !element
    ) {
        return;
    }


    if (
        UI_STATE
            .lukySpeechTimer
    ) {

        clearTimeout(
            UI_STATE
                .lukySpeechTimer
        );
    }


    element.textContent =
        text;


    bubble.hidden =
        false;


    if (
        duration >
        0
    ) {

        UI_STATE.lukySpeechTimer =
            setTimeout(
                hideLukySpeech,
                duration
            );
    }
}


function hideLukySpeech() {

    const bubble =
        document.getElementById(
            "luky-speech"
        );


    if (bubble) {

        bubble.hidden =
            true;
    }


    UI_STATE.lukySpeechTimer =
        null;
}


function showPlayerSpeech(
    text,
    duration =
        GAME_CONFIG
            .speech
            .defaultDurationMs
) {

    if (!text) {
        return;
    }


    const bubble =
        document.getElementById(
            "player-speech"
        );


    const element =
        document.getElementById(
            "player-speech-text"
        );


    if (
        !bubble ||
        !element
    ) {
        return;
    }


    if (
        UI_STATE
            .playerSpeechTimer
    ) {

        clearTimeout(
            UI_STATE
                .playerSpeechTimer
        );
    }


    element.textContent =
        text;


    bubble.hidden =
        false;


    if (
        duration >
        0
    ) {

        UI_STATE.playerSpeechTimer =
            setTimeout(
                hidePlayerSpeech,
                duration
            );
    }
}


function hidePlayerSpeech() {

    const bubble =
        document.getElementById(
            "player-speech"
        );


    if (bubble) {

        bubble.hidden =
            true;
    }


    UI_STATE.playerSpeechTimer =
        null;
}


function resetSpeechUI() {

    UI_STATE
        .speechSequenceToken +=
        1;


    UI_STATE.openingSpeechActive =
        false;


    if (
        UI_STATE
            .lukySpeechTimer
    ) {

        clearTimeout(
            UI_STATE
                .lukySpeechTimer
        );
    }


    if (
        UI_STATE
            .playerSpeechTimer
    ) {

        clearTimeout(
            UI_STATE
                .playerSpeechTimer
        );
    }


    hideLukySpeech();

    hidePlayerSpeech();
}


/* =========================================================
   EMOTES
========================================================= */

function startUIEmote(
    detail
) {

    if (
        !detail?.actor ||
        !detail?.image
    ) {
        return;
    }


    if (
        detail.actor ===
        "luky"
    ) {

        UI_STATE.activeLukyEmote =
            true;


        const image =
            document.getElementById(
                "luky-photo"
            );


        if (image) {

            image.hidden =
                false;


            image.src =
                detail.image;
        }


        return;
    }


    if (
        detail.actor ===
        "player"
    ) {

        UI_STATE.activePlayerEmote =
            true;


        const image =
            document.getElementById(
                "player-avatar"
            );


        if (image) {

            image.hidden =
                false;


            image.src =
                detail.image;
        }
    }
}


function endUIEmote(
    actor
) {

    if (
        actor ===
        "luky"
    ) {

        UI_STATE.activeLukyEmote =
            false;


        restoreLukyImage();

        return;
    }


    if (
        actor ===
        "player"
    ) {

        UI_STATE.activePlayerEmote =
            false;


        restorePlayerImage();
    }
}


function restoreLukyImage() {

    setImageWithFallback({
        imageId:
            "luky-photo",

        fallbackId:
            "luky-photo-fallback",

        src:
            GAME_CONFIG
                .opponent
                .defaultImage,

        fallback:
            GAME_CONFIG
                .opponent
                .fallback
    });
}


function restorePlayerImage() {

    const slotIndex =
        getActiveSlotIndex();


    if (
        slotIndex ===
        null
    ) {
        return;
    }


    const slot =
        getSaveSlot(
            slotIndex
        );


    if (!slot) {
        return;
    }


    setImageWithFallback({
        imageId:
            "player-avatar",

        fallbackId:
            "player-avatar-fallback",

        src:
            getSlotCharacterImage(
                slot
            ),

        fallback:
            getCharacterConfig(
                slot.characterId
            )?.fallback ||
            "?"
    });
}


function resetEmoteUI() {

    UI_STATE.activeLukyEmote =
        false;


    UI_STATE.activePlayerEmote =
        false;
}


/* =========================================================
   GAME OVER
========================================================= */

function showGameOver(
    detail
) {

    if (!detail) {
        return;
    }


    const playerWon =
        detail.winner ===
        "player";


    setText(
        "game-over-title",
        playerWon
            ? "Vyhrál jsi!"
            : "Luky vyhrál!"
    );


    setText(
        "game-over-player-name",
        getCharacterName(
            detail.characterId
        )
    );


    const playerImage =
        document.getElementById(
            "game-over-player-image"
        );


    const lukyImage =
        document.getElementById(
            "game-over-luky-image"
        );


    if (
        playerImage &&
        detail.playerImage
    ) {

        playerImage.src =
            detail.playerImage;
    }


    if (
        lukyImage &&
        detail.lukyImage
    ) {

        lukyImage.src =
            detail.lukyImage;
    }


    if (
        detail.slot
    ) {

        setText(
            "game-over-score",
            getSlotRecordText(
                detail.slot
            )
        );
    }


    renderMainMenuStats();


    openModal(
        "modal-game-over"
    );
}


/* =========================================================
   MUSIC SETTINGS
========================================================= */

function setupMusicControls() {

    const checkbox =
        document.getElementById(
            "music-enabled-checkbox"
        );


    checkbox?.addEventListener(
        "change",
        () => {

            setMusicEnabled(
                checkbox.checked
            );
        }
    );


    document
        .getElementById(
            "music-toggle-button"
        )
        ?.addEventListener(
            "click",
            () => {

                const enabled =
                    toggleMusicEnabled();


                if (enabled) {

                    startMusicForGame();

                } else {

                    stopMusic();
                }


                renderMusicSetting();

                updateMusicButton();
            }
        );


    window.addEventListener(
        "dotsuno:music-setting-changed",
        (event) => {

            const enabled =
                Boolean(
                    event.detail
                        ?.enabled
                );


            if (!enabled) {

                stopMusic();

            } else if (
                UI_STATE.currentScreen ===
                "screen-game"
            ) {

                startMusicForGame();
            }


            renderMusicSetting();

            updateMusicButton();
        }
    );
}


function renderMusicSetting() {

    const checkbox =
        document.getElementById(
            "music-enabled-checkbox"
        );


    if (checkbox) {

        checkbox.checked =
            isMusicEnabled();
    }
}


function updateMusicButton() {

    const button =
        document.getElementById(
            "music-toggle-button"
        );


    const icon =
        document.getElementById(
            "music-toggle-icon"
        );


    if (
        !button ||
        !icon
    ) {
        return;
    }


    const enabled =
        isMusicEnabled();


    button.setAttribute(
        "aria-pressed",
        String(
            enabled
        )
    );


    button.setAttribute(
        "aria-label",
        enabled
            ? "Vypnout hudbu"
            : "Zapnout hudbu"
    );


    icon.textContent =
        enabled
            ? "🔊"
            : "🔇";
}


/* =========================================================
   YOUTUBE
========================================================= */

window.onYouTubeIframeAPIReady =
    function onYouTubeIframeAPIReady() {

        const target =
            GAME_CONFIG
                .music
                .youtube
                .playerElementId;


        if (
            !window.YT ||
            !YT.Player
        ) {
            return;
        }


        UI_STATE.youtubePlayer =
            new YT.Player(
                target,
                {
                    height:
                        "1",

                    width:
                        "1",

                    videoId:
                        GAME_CONFIG
                            .music
                            .youtube
                            .videoId,

                    playerVars: {
                        autoplay:
                            0,

                        controls:
                            0,

                        disablekb:
                            1,

                        fs:
                            0,

                        modestbranding:
                            1,

                        playsinline:
                            1,

                        rel:
                            0
                    },

                    events: {

                        onReady:
                            () => {

                                UI_STATE.youtubeReady =
                                    true;


                                try {

                                    UI_STATE
                                        .youtubePlayer
                                        .setVolume(
                                            GAME_CONFIG
                                                .music
                                                .volume
                                        );

                                } catch {
                                    // ignore
                                }


                                if (
                                    UI_STATE.currentScreen ===
                                        "screen-game" &&
                                    isMusicEnabled()
                                ) {

                                    startMusicForGame();
                                }
                            }
                    }
                }
            );
    };


function startMusicForGame() {

    if (
        !isMusicEnabled() ||
        UI_STATE.currentScreen !==
            "screen-game"
    ) {
        return;
    }


    if (
        !UI_STATE.youtubeReady ||
        !UI_STATE.youtubePlayer
    ) {
        return;
    }


    /*
        Pokud už hudba v aktuální partii hraje,
        znovu nevybíráme jinou skladbu.
    */

    if (
        UI_STATE.musicPlaying
    ) {
        return;
    }


    const track =
        getRandomMusicTrack();


    UI_STATE.activeMusicTrack =
        track;


    try {

        UI_STATE
            .youtubePlayer
            .loadVideoById({
                videoId:
                    GAME_CONFIG
                        .music
                        .youtube
                        .videoId,

                startSeconds:
                    track.startSeconds ||
                    0
            });


        UI_STATE
            .youtubePlayer
            .setVolume(
                GAME_CONFIG
                    .music
                    .volume
            );


        UI_STATE
            .youtubePlayer
            .playVideo();


        UI_STATE.musicPlaying =
            true;

    } catch (error) {

        console.warn(
            "Hudbu se nepodařilo spustit.",
            error
        );
    }
}


function stopMusic() {

    if (
        UI_STATE.youtubePlayer
    ) {

        try {

            UI_STATE
                .youtubePlayer
                .stopVideo();

        } catch {
            // ignore
        }
    }


    UI_STATE.musicPlaying =
        false;


    UI_STATE.activeMusicTrack =
        null;
}


/* =========================================================
   IMAGE FALLBACKS
========================================================= */

function setupStaticImageFallbacks() {

    document
        .querySelectorAll(
            "[data-character-image]"
        )
        .forEach(
            (image) => {

                image.addEventListener(
                    "error",
                    () => {

                        const characterId =
                            image.dataset
                                .characterImage;


                        const fallback =
                            document.querySelector(
                                `[data-character-fallback="${CSS.escape(characterId)}"]`
                            );


                        image.hidden =
                            true;


                        if (fallback) {

                            fallback.hidden =
                                false;
                        }
                    }
                );
            }
        );
}


function setImageWithFallback({
    imageId,
    fallbackId,
    src,
    fallback
}) {

    const image =
        document.getElementById(
            imageId
        );


    const fallbackElement =
        document.getElementById(
            fallbackId
        );


    if (
        !image ||
        !fallbackElement
    ) {
        return;
    }


    fallbackElement.textContent =
        fallback ||
        "?";


    fallbackElement.hidden =
        true;


    image.hidden =
        false;


    image.onerror =
        () => {

            image.hidden =
                true;


            fallbackElement.hidden =
                false;
        };


    image.onload =
        () => {

            image.hidden =
                false;


            fallbackElement.hidden =
                true;
        };


    image.src =
        src;
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    text,
    duration = 3000
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    if (
        UI_STATE.toastTimer
    ) {

        clearTimeout(
            UI_STATE.toastTimer
        );
    }


    setText(
        "toast-title",
        title
    );


    setText(
        "toast-text",
        text
    );


    toast.hidden =
        false;


    UI_STATE.toastTimer =
        setTimeout(
            () => {

                toast.hidden =
                    true;


                UI_STATE.toastTimer =
                    null;
            },
            duration
        );
}


/* =========================================================
   HELPERS
========================================================= */

function formatCardCount(
    count
) {

    if (
        count ===
        1
    ) {
        return "1 karta";
    }


    if (
        count >= 2 &&
        count <= 4
    ) {
        return `${count} karty`;
    }


    return `${count} karet`;
}


function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        String(
            value ??
            ""
        );
}


function uiSleep(
    milliseconds
) {

    return new Promise(
        (resolve) => {

            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}
