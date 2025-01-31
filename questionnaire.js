let jsonData; // Pour stocker les données JSON
let scoresDict = {}; // Dictionnaire des scores des algorithmes

// Charger le fichier JSON via fetch
fetch('clustering.json')
    .then(response => {
        if (!response.ok) {
            throw new Error("Impossible de lire le fichier clustering.json");
        }
        return response.json();
    })
    .then(data => {
        jsonData = data; // Charger les données JSON
        initializeScores(jsonData); // Initialiser les scores des algorithmes
        askQuestions(0); // Commencer le processus de questions
    })
    .catch(error => {
        console.error("Erreur lors du chargement du fichier JSON :", error);
});

// Initialiser les scores des algorithmes à 0
function initializeScores(data) {
    data.questions[0].scores.forEach((scoreObj) => {
        for (let key in scoreObj) {
            scoresDict[key] = 0; // Initialise chaque algorithme avec un score de 0
        }
    });
}

// Fonction pour vérifier si une question est viable
function isViableQuestion(question, aliveModels) {
    const scores = question.scores;

    // Pour chaque option, vérifier si elle met tous les modèles vivants à -Infinity
    for (let i = 0; i < question.options.length; i++) {
        let viable = false;

        for (let alg of aliveModels) {
            const currentScore = scores.find(scoreObj => alg in scoreObj)[alg][i];
            if (currentScore !== "inf_neg") {
                viable = true;
                break; // Cette option ne tue pas tous les algorithmes vivants
            }
        }

        if (viable) return true; // La question a au moins une option viable
    }

    return false; // Toutes les options mettent les modèles vivants à -Infinity
}

// Fonction pour poser les questions
function askQuestions(idx) {
    if (idx >= jsonData.questions.length) {
        showFinalScores(scoresDict); // Afficher les scores finaux quand toutes les questions sont répondues
        return;
    }

    const aliveModels = stillAlive();

    // Vérifie si la question actuelle est viable
    const question = jsonData.questions[idx];
    const questionViable = isViableQuestion(question, aliveModels)
    console.log(questionViable);
    if (!questionViable) {
        // Passer à la question suivante si celle-ci n'est pas viable
        askQuestions(idx + 1);
        return;
    }

    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options');

    // Mettre à jour la question affichée
    questionElement.textContent = question.question;

    // Effacer les anciennes options et ajouter les nouvelles
    optionsContainer.innerHTML = '';
    question.options.forEach((option, i) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.className = 'option-button';
        button.addEventListener('click', () => {
            handleAnswer(i, question.scores); // Gérer la réponse de l'utilisateur
            askQuestions(idx + 1); // Passer à la question suivante
        });
        optionsContainer.appendChild(button);
    });
}

// Retourne la liste des modèles encore disponibles
function stillAlive() {
    const listeAlive = [];
    for (let alg in scoresDict) {
        const currentScore = scoresDict[alg];
        if (!(currentScore === -Infinity)) {
            listeAlive.push(alg);
        }
    }
    console.log(listeAlive);
    return listeAlive;
}

// Gérer la réponse de l'utilisateur et mettre à jour les scores
function handleAnswer(selectedOptionIndex, scores) {
    scores.forEach((scoreObj) => {
        for (let alg in scoreObj) {
            const currentScore = scoreObj[alg][selectedOptionIndex] === 'inf_neg' ? -Infinity : parseInt(scoreObj[alg][selectedOptionIndex]);

            // Si le score actuel est -Infinity ou si le score global est déjà -Infinity, le score reste -Infinity
            if (currentScore === -Infinity || scoresDict[alg] === -Infinity) {
                scoresDict[alg] = -Infinity;
            } else {
                scoresDict[alg] += currentScore;
            }
        }
    });
}

// Afficher le bouton de redémarrage après les résultats
function showFinalScores(scoresDict) {
    // Récupère la section des résultats
    const resultsSection = document.getElementById('results-section');
    const resultsList = document.getElementById('results-list');
    const restartButton = document.getElementById('restart-button');

    // Vérifie si resultsList existe dans le DOM
    if (!resultsList) {
        console.error("L'élément #results-list est introuvable !");
        return;
    }

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

// Fonction pour réinitialiser l'algorithme
function resetAlgorithm() {
    // Réinitialiser les scores
    for (let key in scoresDict) {
        scoresDict[key] = 0;
    }

    // Réinitialiser l'interface
    const resultsSection = document.getElementById('results-section');
    const optionsContainer = document.getElementById('options');
    const questionElement = document.getElementById('question');
    const restartButton = document.getElementById('restart-button');

    resultsSection.style.display = 'none'; // Cacher les résultats
    optionsContainer.innerHTML = ''; // Vider les options
    questionElement.textContent = ''; // Vider la question

    // Réinitialiser l'affichage des scores
    const resultsList = document.getElementById('results-list');
    if (resultsList) {
        resultsList.innerHTML = '';
    }

    restartButton.style.display = 'none'; // Cacher le bouton relancer

    // Redémarrer l'algorithme
    askQuestions(0); // Recommence à la première question
}
