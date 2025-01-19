const fs = require('fs');

// Lecture du fichier JSON
fs.readFile('clustering.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Erreur de lecture du fichier:", err);
        return;
    }

    const jsonData = JSON.parse(data);

    // Initialisation du dictionnaire des scores
    let scoresDict = {};
    jsonData.questions[0].scores.forEach((scoreObj) => {
        for (let key in scoreObj) {
            scoresDict[key] = 0; // Initialise chaque algorithme avec un score global de 0
        }
    });

    // Fonction pour poser les questions
    async function askQuestions(questions, idx = 0) {
        if (idx >= questions.length) {
            console.log("Mise à jour des scores terminée:", scoresDict);
            return;
        }

        const question = questions[idx];
        const options = question.options;
        const scores = question.scores;
        console.log(`${idx + 1}. ${question.question}`);
        
        options.forEach((option, i) => {
            console.log(`    ${i + 1}. ${option}`);
        });

        let response;
        do {
            response = await getUserInput('Choisissez une option (1-' + options.length + '): ');
        } while (!isValidResponse(response, options.length));

        const selectedOptionIndex = parseInt(response) - 1;

        // Mise à jour des scores des algorithmes
        scores.forEach((scoreObj) => {
            for (let alg in scoreObj) {
                const currentScore = scoreObj[alg][selectedOptionIndex] === 'inf_neg' ? -Infinity : parseInt(scoreObj[alg][selectedOptionIndex]);

                // Si le score courant est -Infinity ou le score global est déjà -Infinity, le score reste -Infinity
                if (currentScore === -Infinity || scoresDict[alg] === -Infinity) {
                    scoresDict[alg] = -Infinity;
                } else {
                    scoresDict[alg] += currentScore;
                }
            }
        });

        askQuestions(questions, idx + 1);  // Poser la question suivante
    }

    // Fonction pour obtenir une réponse de l'utilisateur (via `readline-sync`)
    function getUserInput(promptText) {
        const readlineSync = require('readline-sync');
        return readlineSync.question(promptText);
    }

    // Fonction pour valider la réponse de l'utilisateur
    function isValidResponse(response, maxOption) {
        const parsed = parseInt(response);
        if (isNaN(parsed) || parsed < 1 || parsed > maxOption) {
            console.log("Réponse invalide, veuillez entrer un entier entre 1 et " + maxOption + ".");
            return false;
        }
        return true;
    }

    // Lancer le processus de questions
    askQuestions(jsonData.questions);
});

