import csv
import json

def csv_to_json(file_path):
    data = {"questions": []}

    with open(file_path, mode='r', encoding='utf-8') as csv_file:
        reader = list(csv.reader(csv_file))
        
        rowcount = len(reader)
        colcount = len(reader[0]) if rowcount > 0 else 0

        for j in range(1, colcount):
            question = reader[0][j]
            option_string = reader[1][j]
            options = option_string.split(", ")

            scores = []

            for i in range(2, rowcount):
                nom_model = reader[i][0]
                scores_string = reader[i][j]
                liste_scores = [score if score != "-inf" else "inf_neg" for score in scores_string.split(", ")]
                
                scores.append({nom_model: liste_scores})

            data["questions"].append({
                "question": question,
                "options": options,
                "scores": scores
            })

    return json.dumps(data, indent=4, ensure_ascii=False)

file_names = ["classification", "clustering", "detection_anomalies", "creation_modification_contenu", "prediction"]

for file_name in file_names:
    file_path_complet = "csv/" + file_name + ".csv"
    json_data = csv_to_json(file_path_complet)
    json_file_name = "json/" + file_name + ".json"
    with open(json_file_name, mode='w', encoding='utf-8') as json_file:
        json_file.write(json_data)
