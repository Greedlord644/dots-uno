"use strict";


/* =========================================================
   DOTS UNO
   UI VRSTVA

   Řeší:
   - obrazovky
   - save sloty
   - výběr postavy
   - skiny
   - achievementy
   - herní stůl
   - výběr karet
   - Kuř!
   - drag & drop
   - výběr barvy
   - sedmičku
   - Stůj
   - UNO
   - hlášky
   - emoty
   - game over
========================================================= */


/* =========================================================
   UI STATE
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

    drag: {

        active: false,

        pointerId: null,

        cardId: null,

        startX: 0,

        startY: 0,

        currentX: 0,

        currentY: 0,

        moved: false,

        element: null
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

    setupGameEvents();

    setupStaticImageFallbacks();

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


    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


/* =========================================================
   NAVIGACE
========================================================= */

function setupNavigation() {

    const openSlots =
        document.getElementById(
            "open-slots-button"
        );


    openSlots?.addEventListener(
        "click",
        () => {

            renderSaveSlots();

            showScreen(
                "screen-slots"
            );
        }
    );


    const openAchievements =
        document.getElementById(
            "open-achievements-button"
        );


    openAchievements?.addEventListener(
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


    const characterBack =
        document.getElementById(
            "character-select-back"
        );


    characterBack?.addEventListener(
        "click",
        () => {

            clearNewCharacterSelection();

            renderSaveSlots();

            showScreen(
                "screen-slots"
            );
        }
    );


    const skinBack =
        document.getElementById(
            "skin-select-back"
        );


    skinBack?.addEventListener(
        "click",
        () => {

            const slotIndex =
                UI_STATE
                    .selectedSlotIndex;


            if (
                slotIndex === null
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
   HLAVNÍ MENU – STATISTIKY
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
                String(index + 1);


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


/* =========================================================
   KLIK NA SLOT
========================================================= */

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
   DETAIL SLOTU
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
        hasActiveGame(slot)
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


/* =========================================================
   AKCE SLOTU
========================================================= */

function setupSlotActions() {

    const continueButton =
        document.getElementById(
            "continue-game-button"
        );


    continueButton?.addEventListener(
        "click",
        () => {

            const slotIndex =
                UI_STATE
                    .selectedSlotIndex;


            if (
                slotIndex === null
            ) {
                return;
            }


            startGameUI(
                slotIndex,
                true
            );
        }
    );


    const nextGameButton =
        document.getElementById(
            "start-next-game-button"
        );


    nextGameButton?.addEventListener(
        "click",
        () => {

            const slotIndex =
                UI_STATE
                    .selectedSlotIndex;


            if (
                slotIndex === null
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


    const changeSkinButton =
        document.getElementById(
            "change-skin-button"
        );


    changeSkinButton?.addEventListener(
        "click",
        () => {

            const slotIndex =
                UI_STATE
                    .selectedSlotIndex;


            if (
                slotIndex === null
            ) {
                return;
            }


            openExistingSkinSelection(
                slotIndex
            );
        }
    );


    const resetSlotButton =
        document.getElementById(
            "reset-slot-button"
        );


    resetSlotButton?.addEventListener(
        "click",
        () => {

            openModal(
                "modal-reset-slot"
            );
        }
    );
}


/* =========================================================
   VÝBĚR POSTAVY
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


    const changeButton =
        document.getElementById(
            "change-character-button"
        );


    changeButton?.addEventListener(
        "click",
        () => {

            clearNewCharacterSelection();
        }
    );


    const confirmButton =
        document.getElementById(
            "confirm-character-button"
        );


    confirmButton?.addEventListener(
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


/* =========================================================
   DOPORUČENÁ POSTAVA 96
========================================================= */

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


/* =========================================================
   VÝBĚR POSTAVY
========================================================= */

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
        behavior: "smooth",
        block: "nearest"
    });
}


/* =========================================================
   NOVÁ POSTAVA – SKINY
========================================================= */

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
        !UI_STATE
            .selectedCharacterId ||
        !UI_STATE
            .selectedSkinId ||
        !isSkinUnlocked(
            UI_STATE
                .selectedCharacterId,
            UI_STATE
                .selectedSkinId
        );
}


/* =========================================================
   RESET NOVÉHO VÝBĚRU
========================================================= */

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


/* =========================================================
   POTVRZENÍ NOVÉ POSTAVY
========================================================= */

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
        slotIndex === null ||
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
   SKINY EXISTUJÍCÍHO SLOTU
========================================================= */

function setupSkinSelection() {

    const saveSkinButton =
        document.getElementById(
            "save-skin-button"
        );


    saveSkinButton?.addEventListener(
        "click",
        () => {

            const slotIndex =
                UI_STATE
                    .selectedSlotIndex;


            const skinId =
                UI_STATE
                    .existingSlotSkinId;


            if (
                slotIndex === null ||
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
        slotIndex === null
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
        slotIndex === null ||
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


/* =========================================================
   GENERICKÝ SKIN GRID
========================================================= */

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


            if (
                achievement.target > 1
            ) {

                progress.hidden =
                    false;


                const percent =
                    Math.min(
                        100,
                        (
                            achievement.current /
                            achievement.target
                        ) * 100
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


/* =========================================================
   SPUŠTĚNÍ HRY
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


    resetSpeechUI();

    resetEmoteUI();


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
}


/* =========================================================
   HERNÍ OVLÁDÁNÍ
========================================================= */

function setupGameControls() {

    const drawPile =
        document.getElementById(
            "draw-pile"
        );


    drawPile?.addEventListener(
        "click",
        () => {

            const state =
                getGameState();


            if (
                state?.skipChainCount > 0 &&
                state.turn === "player"
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


    const unoButton =
        document.getElementById(
            "uno-button"
        );


    unoButton?.addEventListener(
        "click",
        playerCallUno
    );


    const catchUnoButton =
        document.getElementById(
            "catch-uno-button"
        );


    catchUnoButton?.addEventListener(
        "click",
        playerCatchLukyUno
    );


    const acceptSkipButton =
        document.getElementById(
            "accept-skip-button"
        );


    acceptSkipButton?.addEventListener(
        "click",
        () => {

            UI_STATE
                .selectedCardIds
                .clear();


            playerAcceptSkip();
        }
    );


    const yellowButton =
        document.getElementById(
            "ask-yellow-button"
        );


    yellowButton?.addEventListener(
        "click",
        askLukyAboutYellow
    );


    const gameMenuButton =
        document.getElementById(
            "game-menu-button"
        );


    gameMenuButton?.addEventListener(
        "click",
        () => {

            pauseGame();


            openModal(
                "modal-game-menu"
            );
        }
    );


    const resumeButton =
        document.getElementById(
            "resume-game-button"
        );


    resumeButton?.addEventListener(
        "click",
        () => {

            closeModal();

            resumeGame();
        }
    );


    const saveAndMenu =
        document.getElementById(
            "save-and-menu-button"
        );


    saveAndMenu?.addEventListener(
        "click",
        () => {

            saveAndLeaveGame();


            closeModal();


            renderMainMenuStats();


            showScreen(
                "screen-menu"
            );
        }
    );


    const playAgain =
        document.getElementById(
            "play-again-button"
        );


    playAgain?.addEventListener(
        "click",
        () => {

            const slotIndex =
                UI_STATE
                    .selectedSlotIndex;


            closeModal();


            if (
                slotIndex === null
            ) {
                return;
            }


            startGameUI(
                slotIndex,
                false
            );
        }
    );


    const gameOverMenu =
        document.getElementById(
            "game-over-menu-button"
        );


    gameOverMenu?.addEventListener(
        "click",
        () => {

            closeModal();


            renderMainMenuStats();


            showScreen(
                "screen-menu"
            );
        }
    );
}


/* =========================================================
   VYKRESLENÍ HRY
========================================================= */

function renderGame() {

    const state =
        getGameState();


    const slotIndex =
        getActiveSlotIndex();


    if (
        !state ||
        slotIndex === null
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


    /*
        Výběr může po změně ruky obsahovat už neexistující ID.
    */

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
        "game-luky-score",
        slot.losses
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
   OVLÁDÁNÍ PODLE STAVU
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
                0;


        drawPile.setAttribute(
            "aria-disabled",
            String(
                drawPile.disabled
            )
        );
    }
}


/* =========================================================
   HRÁČOVA RUKA
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
                "is-match-highlight",
                shouldHighlightIdenticalCard(
                    card,
                    hand
                ) &&
                !selected
            );


            const interactive =
                state.status ===
                    "playing" &&
                state.turn ===
                    "player";


            element.disabled =
                !interactive;


            element.classList.toggle(
                "is-disabled",
                !interactive
            );


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
                        card,
                        element
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
   LUKYHO KARTY
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
   ODHOD
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
            state.discardPile.length - 1
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


    element.classList.add(
        "is-disabled"
    );


    container.appendChild(
        element
    );
}


/* =========================================================
   VYTVOŘENÍ KARTY
========================================================= */

function createCardElement(card) {

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
   VÝBĚR KARET
========================================================= */

function handleCardClick(card) {

    if (
        UI_STATE.drag.moved
    ) {

        UI_STATE.drag.moved =
            false;


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


        return;
    }


    if (
        selected.size === 0
    ) {

        selected.add(
            card.id
        );


        renderPlayerHand(
            state
        );


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
}


/* =========================================================
   HIGHLIGHT PRO KUŘ!
========================================================= */

function shouldHighlightIdenticalCard(
    card,
    hand
) {

    const selected =
        UI_STATE
            .selectedCardIds;


    if (
        selected.size === 0 ||
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


/* =========================================================
   ČIŠTĚNÍ VÝBĚRU
========================================================= */

function sanitizeSelectedCards(hand) {

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
   DRAG START
========================================================= */

function beginCardDrag(
    event,
    card,
    element
) {

    if (
        event.button !==
            undefined &&
        event.button !== 0
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


    /*
        Kartu, kterou táhneme, vždy zahrneme do výběru.
        Pokud je vybraná jiná skupina, výběr se změní.
    */

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


        element =
            document.querySelector(
                `[data-card-id="${CSS.escape(card.id)}"]`
            );


        if (!element) {
            return;
        }
    }


    UI_STATE.drag = {

        active: true,

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

        moved: false,

        element
    };


    element.setPointerCapture?.(
        event.pointerId
    );


    element.classList.add(
        "is-dragging"
    );


    window.addEventListener(
        "pointermove",
        handleCardDragMove
    );


    window.addEventListener(
        "pointerup",
        endCardDrag,
        {
            once: true
        }
    );


    window.addEventListener(
        "pointercancel",
        cancelCardDrag,
        {
            once: true
        }
    );
}


/* =========================================================
   DRAG MOVE
========================================================= */

function handleCardDragMove(event) {

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


    if (
        drag.element
    ) {

        drag.element.style.transform =
            `translate(${deltaX}px, ${deltaY}px) scale(1.06)`;
    }


    updateDropZoneState(
        event.clientX,
        event.clientY
    );
}


/* =========================================================
   DRAG END
========================================================= */

function endCardDrag(event) {

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

        attemptSelectedCardPlay();
    }
}


/* =========================================================
   DRAG CANCEL / CLEANUP
========================================================= */

function cancelCardDrag() {

    cleanupCardDrag();
}


function cleanupCardDrag() {

    const drag =
        UI_STATE.drag;


    if (
        drag.element
    ) {

        drag.element.classList.remove(
            "is-dragging"
        );


        drag.element.style.transform =
            "";
    }


    document
        .getElementById(
            "discard-zone"
        )
        ?.classList
        .remove(
            "is-drop-target"
        );


    window.removeEventListener(
        "pointermove",
        handleCardDragMove
    );


    UI_STATE.drag.active =
        false;


    UI_STATE.drag.pointerId =
        null;


    UI_STATE.drag.element =
        null;
}


/* =========================================================
   DROP ZONE
========================================================= */

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
        "is-drop-target",
        isPointInsideDropZone(
            x,
            y
        )
    );
}


/* =========================================================
   ZAHRÁNÍ VYBRANÝCH KARET
========================================================= */

async function attemptSelectedCardPlay() {

    const ids =
        [
            ...UI_STATE
                .selectedCardIds
        ];


    if (
        ids.length === 0
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


        openModal(
            "modal-color"
        );


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

        penalty.hidden =
            state.drawPenalty <=
            0;
    }


    setText(
        "draw-penalty-value",
        `+${state.drawPenalty}`
    );


    setText(
        "current-color-label",
        CARD_COLOR_LABELS[
            state.currentColor
        ] ||
        "—"
    );


    const currentColor =
        document.getElementById(
            "current-color-indicator"
        );


    if (currentColor) {

        currentColor.dataset.color =
            state.currentColor ||
            "";
    }
}


/* =========================================================
   ŽLUTÝ EVENT
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
   STATUS HRY
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
        state.drawPenalty > 0
    ) {

        text =
            state.turn ===
                "player"
                ? `Přehraj penalizaci +${state.drawPenalty}, nebo si vezmi karty.`
                : `Luky řeší penalizaci +${state.drawPenalty}.`;

    } else if (
        state.skipChainCount > 0
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


/* =========================================================
   MODALY
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


                        UI_STATE
                            .selectedCardIds
                            .clear();


                        closeModal();


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
                    slotIndex === null
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


/* =========================================================
   OPEN / CLOSE MODAL
========================================================= */

function openModal(modalId) {

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
        "yellow-event-available"
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
                "UNO!",
                `Bereš ${event.detail?.penalty ?? 2} karty.`
            );
        }
    );


    window.addEventListener(
        "dotsuno:game-over",
        (event) => {

            showGameOver(
                event.detail
            );
        }
    );
}


/* =========================================================
   OPENING HLÁŠKY
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


    if (
        normalized.type ===
        "single"
    ) {

        showLukySpeech(
            normalized.text,
            GAME_CONFIG
                .speech
                .defaultDurationMs
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
                .speechSequenceToken
        ) {
            return;
        }


        showLukySpeech(
            line,
            GAME_CONFIG
                .speech
                .defaultDurationMs
        );


        await uiSleep(
            GAME_CONFIG
                .speech
                .defaultDurationMs +
            GAME_CONFIG
                .speech
                .sequencePauseMs
        );
    }
}


/* =========================================================
   HLÁŠKY LUKYHO
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
        duration > 0
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


/* =========================================================
   HLÁŠKY HRÁČE
========================================================= */

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
        duration > 0
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


/* =========================================================
   RESET SPEECH
========================================================= */

function resetSpeechUI() {

    UI_STATE
        .speechSequenceToken +=
        1;


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
   EMOTY
========================================================= */

function startUIEmote(detail) {

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


        document
            .querySelector(
                ".opponent-photo-wrap"
            )
            ?.classList
            .add(
                "is-emote"
            );


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


        document
            .querySelector(
                ".player-avatar-wrap"
            )
            ?.classList
            .add(
                "is-emote"
            );
    }
}


function endUIEmote(actor) {

    if (
        actor === "luky"
    ) {

        UI_STATE.activeLukyEmote =
            false;


        document
            .querySelector(
                ".opponent-photo-wrap"
            )
            ?.classList
            .remove(
                "is-emote"
            );


        restoreLukyImage();


        return;
    }


    if (
        actor === "player"
    ) {

        UI_STATE.activePlayerEmote =
            false;


        document
            .querySelector(
                ".player-avatar-wrap"
            )
            ?.classList
            .remove(
                "is-emote"
            );


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
        slotIndex === null
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


    document
        .querySelector(
            ".opponent-photo-wrap"
        )
        ?.classList
        .remove(
            "is-emote"
        );


    document
        .querySelector(
            ".player-avatar-wrap"
        )
        ?.classList
        .remove(
            "is-emote"
        );
}


/* =========================================================
   GAME OVER
========================================================= */

function showGameOver(detail) {

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


/* =========================================================
   SET IMAGE
========================================================= */

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
   POČET KARET
========================================================= */

function formatCardCount(count) {

    if (
        count === 1
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


/* =========================================================
   SET TEXT
========================================================= */

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


/* =========================================================
   SLEEP
========================================================= */

function uiSleep(milliseconds) {

    return new Promise(
        (resolve) => {

            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}
