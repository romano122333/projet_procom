# projet_procom

clustering.csv ==> format de sortie du Google Sheets

clustering.json ==> fichier csv traité par le python csv_to_json.py

csv_to_json.py ==> fichier qui transforme le csv en json
/!\ il doit être dans le même dossier en local,
il faut renseigner le nom du fichier sans l'extension .csv pour qu'il fonctionne,
et il faut bien s'assurer que le csv est bien mis en forme.

index.html ==> code html à executer en local
/!\ il faut lancer un serveur python et l'héberger dessus, autrement le .js ne pourra pas récupérer le .json

package-look.json
package.json ==> permet l'execution de certaines fonctions dans le .js.

questionnaire.js ==> code appelé par le html

question.js ==> version pas finie adaptée pour VSCode directement

recommencer.png ==> petite icône

style.css ==> appelé par le html.

**Pour se servir de l'arbre
**
À mettre dans le terminal :
>> cd Desktop/Dossier_Procom
>> python3 -m http.server 8000

Puis sur Google Chrome :
localhost:8000
