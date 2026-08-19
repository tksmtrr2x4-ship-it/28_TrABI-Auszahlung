const h2 = "text-base font-semibold mt-6 mb-2 first:mt-0";
const p = "text-sm leading-relaxed mb-3 text-foreground/80";

export default function AgbInhalt() {
  return (
    <div>
      <p className="text-xs text-foreground/50 mb-4">Stand: 19.08.2026</p>

      <h2 className={h2}>Präambel</h2>
      <p className={p}>
        Die Stufenkasse des Abiturjahrgangs wird nach Abschluss des Schuljahres aufgelöst und der
        verbleibende Kassenbestand an die anspruchsberechtigten Mitglieder ausgeschüttet. Die
        Verteilung erfolgt leistungsorientiert nach dem in § 2 beschriebenen Verteilungsschlüssel.
        Diese Bedingungen regeln die Anmeldung zum Auszahlungsprogramm, die Ermittlung der
        individuellen Anteile sowie die geltenden Fristen.
      </p>

      <h2 className={h2}>§ 1 Geltungsbereich und Gegenstand</h2>
      <p className={p}>
        (1) Diese Bedingungen gelten für sämtliche Auszahlungen aus der Stufenkasse an die
        Mitglieder des Abiturjahrgangs (nachfolgend „Teilnehmer&quot;).
      </p>
      <p className={p}>
        (2) Gegenstand ist die einmalige, anteilige Auszahlung des Kassenbestands nach Maßgabe des
        Verteilungsschlüssels gemäß § 2.
      </p>

      <h2 className={h2}>§ 2 Verteilungsschlüssel</h2>
      <p className={p}>
        (1) <strong>Gewichteter Pro-Kopf-Anteil:</strong> Der pro Kopf eingezahlte Anteil wird
        gewichtet. Hat eine Klasse vor der Einbringung ihrer Mittel in den Gesamtfonds schlecht
        gewirtschaftet, wird dies bei der Gewichtung berücksichtigt; die Mitglieder dieser Klasse
        erhalten entsprechend einen geringeren prozentualen Endwert.
      </p>
      <p className={p}>
        (2) <strong>Engagement-Bewertung:</strong> Das Engagement jedes Teilnehmers wird auf einer
        Skala von 1 bis 3 bewertet. Die Bewertung beruht auf der Beteiligung im Vordergrund
        (sichtbare Mitwirkung) sowie auf der Beurteilung der Tätigkeiten im Hintergrund
        (organisatorische und unterstützende Arbeit).
      </p>
      <p className={p}>
        (3) Aus beiden Faktoren ergibt sich für jeden Teilnehmer ein individueller prozentualer
        Anteil am Kassenbestand, der ihm im Rahmen des Auszahlungsprogramms zur Verfügung steht.
      </p>

      <h2 className={h2}>§ 3 Vorläufigkeit des mitgeteilten Betrags</h2>
      <p className={p}>
        (1) Der jedem Teilnehmer mitgeteilte Auszahlungswert beruht auf dem <strong>geschätzten</strong>{" "}
        Stand der Stufenkasse zum Zeitpunkt der Mitteilung.
      </p>
      <p className={p}>
        (2) Dieser Wert kann sich bis zur tatsächlichen Auszahlung noch verändern. Er stellt{" "}
        <strong>keine Garantie und keine verbindliche Zusage</strong> einer bestimmten
        Auszahlungshöhe dar.
      </p>

      <h2 className={h2}>§ 4 Anmeldung zum Auszahlungsprogramm</h2>
      <p className={p}>
        (1) Die Anmeldung zum Auszahlungsprogramm erfolgt ausschließlich über den in der
        Auszahlungs-E-Mail bereitgestellten Link.
      </p>
      <p className={p}>
        (2) Die Anmeldefrist beträgt <strong>14 Tage ab Zugang der E-Mail</strong>. Sie endet am{" "}
        <strong>02.09.2026 um 22:00 Uhr</strong>.
      </p>
      <p className={p}>
        (3) Nach Ablauf der Anmeldefrist ist eine Anmeldung zum Auszahlungsprogramm nicht mehr
        möglich.
      </p>

      <h2 className={h2}>§ 5 Einwendungen gegen den mitgeteilten Betrag</h2>
      <p className={p}>
        (1) Teilnehmer, die Beschwerden gegen den mitgeteilten Betrag erheben oder diesen nicht
        anerkennen wollen, müssen dies <strong>innerhalb von 14 Tagen ab Zugang der E-Mail</strong>{" "}
        durch Antwort auf die Auszahlungs-E-Mail erklären.
      </p>
      <p className={p}>
        (2) Nach fristgerechtem Eingang einer Einwendung wird der Fall geprüft und dem Teilnehmer
        das Ergebnis mitgeteilt.
      </p>

      <h2 className={h2}>§ 6 Fristversäumnis</h2>
      <p className={p}>
        (1) Mit Ablauf der in § 4 und § 5 genannten Fristen erlöschen die Ansprüche des jeweiligen
        Teilnehmers auf Auszahlung aus dem Auszahlungsprogramm.
      </p>
      <p className={p}>(2) Eine nachträgliche Geltendmachung ist ausgeschlossen.</p>

      <h2 className={h2}>§ 7 Schlussbestimmungen</h2>
      <p className={p}>(1) Änderungen und Ergänzungen dieser Bedingungen bedürfen der Textform.</p>
      <p className={p}>
        (2) Sollten einzelne Bestimmungen dieser Bedingungen unwirksam sein oder werden, bleibt die
        Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung
        tritt eine Regelung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten
        kommt.
      </p>
      <p className={`${p} mb-0`}>(3) Es gilt das Recht der Bundesrepublik Deutschland.</p>
    </div>
  );
}
