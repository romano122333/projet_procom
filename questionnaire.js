// Données JSON issues des fichiers de cas d'usage
let jsonData;

// Dictionnaire des modèles et de leurs scores
let scoresDict = {};

// Indicateur pour savoir si l'algorithme est en cours
let algo;

// Initialisation du bouton permanent "Relancer"
const restartButton = document.getElementById('permanent-restart-button');
restartButton.addEventListener('click', resetAlgorithm);

/**
 * Affiche la première question : choix du cas d'usage
 */
function chooseUseCase() {
    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options');

    questionElement.textContent = 'Quel cas d\'usage souhaitez-vous choisir ?';

    // Mapping des cas d'usage avec leurs fichiers JSON
    const useCases = {
        "Clustering": "json/clustering.json",
        "Classification": "json/classification.json",
        "Détection d'Anomalie": "json/detection_anomalies.json",
        "Prédiction et Régression": "json/prediction.json",
        "Création / Modification de contenu": "json/creation_modification_contenu.json"
    };

    for (let [useCase, jsonFile] of Object.entries(useCases)) {
        const button = document.createElement('button');
        button.textContent = useCase;
        button.className = 'option-button';
        button.addEventListener('click', () => {
            loadJSON(jsonFile); // Charger le fichier JSON correspondant
        });
        optionsContainer.appendChild(button);
    }
}

function loadJSON(jsonFile) {
    algo = true;
    fetch(jsonFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Impossible de lire le fichier ${jsonFile}`);
            }
            return response.json();
        })
        .then(data => {
            jsonData = data;
            initializeScores(jsonData); // Initialiser les scores des algorithmes
            askQuestions(0); // Commencer les questions
        })
        .catch(error => {
            console.error("Erreur lors du chargement du fichier JSON :", error);
        });
}

/**
 * Initialise les scores des algorithmes à zéro
 */
function initializeScores(data) {
    scoresDict = {};
    data.questions[0].scores.forEach((scoreObj) => {
        for (let key in scoreObj) {
            scoresDict[key] = 0; // Initialise chaque algorithme avec un score de 0
        }
    });
}

/**
 * Vérifie que la question en cours est viable, c'est-à-dite qu'il n'existe pas une option
 * qui mette les scores des modèles encore pertinents à jour à -inf.
 */
function isViableQuestion(question, aliveModels) {
    const scores = question.scores;

    // Boucle sur chaque option de la question
    for (let i = 0; i < question.options.length; i++) {
        // Booléen vrai par défaut qui devient faux si il existe un modèle qui n'est pas mis à jour à -inf pour l'option considérée
        let allDead = true;

        for (let alg of aliveModels) {
            // scoreObj contient les modèles et les scores de la question en cours
            const scoreObj = scores.find(scoreObj => alg in scoreObj);
            const currentScore = scoreObj[alg][i];
            if (currentScore !== "inf_neg") {  // Si au moins un algorithme n'est pas à inf_neg
                allDead = false;
                break;
            }
        }

        if (allDead) return false;
    }

    return true;
}

/**
 * Pose les questions aux utilisateurs de manière itérative
 */
function askQuestions(idx) {
    // Vérification que l'arbre n'est pas arrivé à bout pour ne pas mettre à jour les scores avec de nouvelles réponses
    if (algo){
        // Affichage des scores si on est arrivé en bout d'arbre
        if (idx >= jsonData.questions.length) {
            showFinalScores(scoresDict);
            return;
        }

        const aliveModels = stillAlive();
        const question = jsonData.questions[idx];

        // La question est passée si elle n'est pas viable (cf définition de viable dans le README)
        if (!isViableQuestion(question, aliveModels)) {
            askQuestions(idx + 1);
            return;
        }

        const questionElement = document.getElementById('question');
        const optionsContainer = document.getElementById('options');

        // Modification du contenu de la question
        questionElement.textContent = question.question;

        // Les options sont vidées car toutes les questions n'ont pas le même nombre de réponses
        optionsContainer.innerHTML = '';

        // Ajout des options
        question.options.forEach((option, i) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'option-button';
            // Ajout d'un listener par option
            button.addEventListener('click', () => {
                handleAnswer(i, question.scores, idx);
                askQuestions(idx + 1);
            });
            optionsContainer.appendChild(button);
        });
    }
}

/**
 * Retourne la liste des modèles encore valides (score != -Infinity)
 */
function stillAlive() {
    const listeAlive = [];
    for (let alg in scoresDict) {
        const currentScore = scoresDict[alg];
        if (!(currentScore === -Infinity)) {
            listeAlive.push(alg);
        }
    }
    return listeAlive;
}

/**
 * Gère la réponse de l'utilisateur et met à jour les scores
 */
function handleAnswer(selectedOptionIndex, scores, currentQuestionIndex) {
    // L'algorithme n'est pas executé si on est en bout de branche
    if (!algo) return;

    const question = jsonData.questions[currentQuestionIndex];
    const chosenOption = question.options[selectedOptionIndex];

    // Si aucune analyse de données n'a été effectuée, on arrête l'arbre et on renvoie les scores des modèles
    // Attention : Pour que cette condition soit prise en compte, il faut que la question soit précisément écrite comme suit.
    if ((question["question"] == "Avez-vous réalisé une analyse des données ?") && (chosenOption == "Non")) {
        showFinalScores(scoresDict);
    }

    // Autrement, on met à jour l'algorithme et les scores
    updateHistory(question.question, chosenOption);
    scores.forEach((scoreObj) => {
        for (let alg in scoreObj) {
            const currentScore = scoreObj[alg][selectedOptionIndex] === 'inf_neg' ? -Infinity : parseInt(scoreObj[alg][selectedOptionIndex]);
            if (currentScore === -Infinity || scoresDict[alg] === -Infinity) {
                scoresDict[alg] = -Infinity;
            } else {
                scoresDict[alg] += currentScore;
            }
        }
    });
}

/**
 * Affiche les scores finaux
 */
function showFinalScores(scoresDict) {
    // On indique que l'arbre est fini
    algo = false;

    const resultsSection = document.getElementById('results-section');
    const resultsList = document.getElementById('results-list');
    const restartButton = document.getElementById('restart-button');

    // Vide la liste des résultats pour éviter les doublons
    resultsList.innerHTML = '';

    // Affiche les résultats dans une liste
    for (let algorithm in scoresDict) {
        if (!(scoresDict[algorithm] == -Infinity)) {
            const listItem = document.createElement('li');
            listItem.textContent = `${algorithm}: ${scoresDict[algorithm]}`;
            resultsList.appendChild(listItem);
        }
    }

    // Affiche la section des résultats
    resultsSection.style.display = 'block';

    // Affiche le bouton "Relancer"
    restartButton.style.display = 'block';
    restartButton.addEventListener('click', resetAlgorithm); // Relie le clic au reset
}

/**
 * Met à jour l'historique des questions et des réponses choisies
 */
function updateHistory(question, chosenOption) {
    // Vérification que l'arbre n'est pas arrivé à bout pour ne pas mettre à jour les scores avec de nouvelles réponses
    if (algo){
        const historyContainer = document.getElementById('history-container');

        // Créer une div pour chaque question
        const questionDiv = document.createElement('div');
        questionDiv.className = 'history-item';
        
        // Ajouter la question et la réponse choisie
        questionDiv.innerHTML = `
            <p><strong>Question :</strong> ${question}</p>
            <p><strong>Réponse choisie :</strong> ${chosenOption}</p>
            <hr>
        `;
        
        // Ajouter l’élément au conteneur d’historique
        historyContainer.appendChild(questionDiv);
    }
}

/**
 * Réinitialise l'algorithme et l'interface utilisateur
 */
function resetAlgorithm() {
    // Vider les réponses
    document.getElementById('history-container').innerHTML = '';

    // Réinitialiser les scores
    for (let key in scoresDict) {
        scoresDict[key] = 0;
    }

    // Réinitialiser l'interface
    const resultsSection = document.getElementById('results-section');
    const optionsContainer = document.getElementById('options');
    const questionElement = document.getElementById('question');
    const restartButton = document.getElementById('restart-button');

    resultsSection.style.display = 'none';
    optionsContainer.innerHTML = '';
    questionElement.textContent = '';

    // Réinitialiser l'affichage des scores
    const resultsList = document.getElementById('results-list');
    if (resultsList) {
        resultsList.innerHTML = '';
    }

    // Cacher le bouton relancer
    restartButton.style.display = 'none';

    // Redémarrer l'algorithme
    chooseUseCase();
}

// Démarre le processus avec le choix du cas d'usage
chooseUseCase();