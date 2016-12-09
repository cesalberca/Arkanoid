# Arkanoid
_Por César Alberca_
---

## Instrucciones del juego

Antes de comenzar el juego se deberá ingresar el nombre del jugador. Una vez hecho esto se procederá a hacer click y se liberará la bola. Para pasar al siguiente nivel se deberán de destruir todos los ladrillos de la pantalla.

En caso de que la bola alcance la base de la pantalla, el jugador perderá una vida. El jugador dispone de 3 vidas. Si éste pierde todas se acaba el juego. Su puntuación será guardada en __local storage__ independientemente si ha superado la puntuación máxima. Se mostrará la puntuación máxima de todos los jugadores.

El kit del juego consiste en que cada vez que el jugador supera un nivel, la dificultad de los mismo se incrementa linealmente de la siguiente forma:

* Aumento de número de bolas
* Aumento de ladrillos por columna
* Aumento de ladrillos por fila
* Aumento de velocidad de las bolas
* Rotación de los ladrillos

El juego por tanto no tiene fin. Sólamente termina cuando el jugador pierde todas las vidas.