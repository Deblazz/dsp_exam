# De Blasio Lorenzo - DSP Exam Call 02/09/2026

## MQTT Topics
There are two kinds of MQTT topics in the current architecture. The first one, which is inherited from the initial lab05 project, is `String(filmId)` and is used  in a `QoS 0 + retain: true` configuration to populate the `filmSelections` state in `App.jsx`, then used to show information regarding user activity in `FilmToReviewLibrary.jsx`.

The second family of MQTT topics is the one created for the draft propagation mechanism, `films/{filmId}/reviews/{reviewerId}/draft`. This path is used to bind hierarchically the draft (which is being propagated) to a `filmId + reviewerId` tuple. Moreover `filmId + reviewerId + versionNumber` is used as the composite primary key of the draft table. The MQTT configuration for this topic is `QoS 0 + retain: false` and it is used to notify both the reviewer and co-reviewer in real time whenever a new draft version is submitted. When this happens, the editor is alerted and the local text replaced. 

On a side note, both topics are strictly scoped to a single review or a single film to limit useless traffic. Specifically, the strict scoping of the `String(filmId)` topic is needed for the `retain: true` flag.

## MQTT Messages and Message Validation
The contents of the messages on the MQTT channels are documented in files `mqtt_film_message_schema.json` and in `mqtt_draft_message_schema.json` and are used respectively on the two topics. Syntax validation of the contents of the messages is not performed, coherently with requirements and `lab05` code. Nonetheless, the schemas are designed to accurately describe the real message content with the required constraints.

The message used on the `String(filmId)` topic is carried over from the lab05 project as well, other than a minor fix (bringing coherence in the schema by checking the presence of `status` property to validate the subsequent presence of `userId` and `userName`).

The message used on `films/{filmId}/reviews/{reviewerId}/draft`, on the other hand, has been created appositely for the draft implementation.

## MQTT Configurations
### String(filmId)
As previously mentioned, the topic `String(filmId)` is configured with `QoS 0 + retain:true` 

`QoS 0`: since the `clientId` is generated randomly every reload of the webpage, it would be pointless to set `clean: false` and thus a persistent session could not be enabled. In our circumstance, the best case scenario for a QoS 1/2 setting would be to redeliver messages lost due to a disconnection but without persistent sessions this would not be possible. Moreover, we do not care about the full history of messages (only the last state matters) and we can afford to lose a message, eventually updating the UI after a page reload (topic re-subscription) or a new update (another user selecting a movie).

`retain: true`: is needed, since a client which opens `PublicToReviewLayout` will be potentially subscribing after someone else already selected a film as active. Without `retain: true` the new client would not see any information before an update. Thanks to retain, `filmSelections` in `App.jsx` is effectively populated.

### films/{filmId}/reviews/{reviewerId}/draft
The new `films/{filmId}/reviews/{reviewerId}/draft` topic, meanwhile is configured with `QoS 0 + retain: false`

`QoS 0`: like for the previous topic, a different QoS policy would not be useful due to the lack of persistent sessions. In case of a lost MQTT message, the worst case scenario, the user would simply miss the update alert with subsequent updated text but this poses no real danger since a misaligned version submission would be caught by the server first and the DB constraint would act as a final backstop.

`retain: false`: is superfluous since the initial text, when editing a draft, is always populated using a GET request, contacting the DB. In this circumstance a new incoming message on the topic means a new draft has been published and thus retain would not be needed even in case of disconnections.