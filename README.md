# Løpeplan – din personlige treningsplan

En enkel mobilapp som gjør det lettere å nå løpemålene dine. Du sier hva du vil klare og innen når, så lager appen en treningsplan og legger øktene rett inn i en kalender.

> **Status:** Første versjon (MVP). Bare løping støttes foreløpig.

---

## Innhold

1. [Mål med appen](#mål-med-appen)
2. [Hvordan appen fungerer](#hvordan-appen-fungerer)
3. [Kravspesifikasjon](#kravspesifikasjon)
4. [Logikken bak treningsplanen](#logikken-bak-treningsplanen)
5. [Økttyper](#økttyper)
6. [Datamodell](#datamodell)
7. [Utenfor omfang i MVP](#utenfor-omfang-i-mvp)
8. [Teknologi](#teknologi)
9. [Kom i gang](#kom-i-gang)
10. [Videre utvikling](#videre-utvikling)
11. [Åpne spørsmål](#åpne-spørsmål)

---

## Mål med appen

Mange setter seg et løpemål, men vet ikke hvordan de skal trene for å nå det. Appen skal:

- gjøre om et mål ("løpe 10 km innen 1. mai") til en konkret plan
- tilpasse planen til hvor godt trent brukeren er
- vise planen i en kalender, så det er lett å se når man skal trene
- forklare hver økt enkelt, så brukeren vet nøyaktig hva som skal gjøres

---

## Hvordan appen fungerer

1. **Brukeren legger inn mål**
   - Distanse (f.eks. 5 km, 10 km, halvmaraton, maraton eller egendefinert)
   - Måldato
   - Måltid (valgfritt)
   - Antall økter per uke (valgfritt – appen foreslår hvis feltet står tomt)
   - Treningsnivå (nybegynner / litt trent / godt trent)
2. **Appen lager et forslag til treningsplan**
3. **Brukeren ser over og godkjenner** (eller justerer og lager på nytt)
4. **Øktene legges inn i kalenderen**
5. **Brukeren trykker på en dato** og får en detaljert beskrivelse av økta

---

## Kravspesifikasjon

### Funksjonelle krav

| ID | Krav | Prioritet |
|----|------|-----------|
| F1 | Brukeren kan velge måldistanse fra en liste eller skrive inn egen distanse i km | Må |
| F2 | Brukeren kan velge måldato | Må |
| F3 | Brukeren kan legge inn ønsket sluttid (valgfritt) | Bør |
| F4 | Brukeren kan velge antall økter per uke (2–6), eller la appen foreslå | Må |
| F5 | Brukeren kan velge treningsnivå: nybegynner, litt trent, godt trent | Må |
| F6 | Brukeren kan legge inn hvor langt de klarer å løpe i dag (valgfritt, gir bedre plan) | Bør |
| F7 | Appen genererer en uke-for-uke treningsplan frem til måldato | Må |
| F8 | Appen sier fra hvis målet er urealistisk (for kort tid), og foreslår ny dato eller kortere distanse | Må |
| F9 | Brukeren kan se planen før godkjenning og velge "Godkjenn" eller "Endre" | Må |
| F10 | Godkjente økter vises i en månedskalender med markering på treningsdager | Må |
| F11 | Ulike økttyper har ulik farge/ikon i kalenderen | Bør |
| F12 | Trykk på en dato viser detaljer: type, varighet/distanse, tempo eller intensitet, oppvarming, hoveddel, nedjogg og et kort tips | Må |
| F13 | Brukeren kan markere en økt som fullført | Bør |
| F14 | Brukeren kan flytte en økt til en annen dag | Kan |
| F15 | Brukeren kan slette planen og starte på nytt | Må |

### Ikke-funksjonelle krav

| ID | Krav |
|----|------|
| N1 | Appen skal fungere uten internett (plan lagres lokalt på telefonen) |
| N2 | Å lage en plan skal ta under 1 minutt fra appen åpnes |
| N3 | Teksten skal være enkel og forståelig for nybegynnere – ingen unødvendig fagsjargong |
| N4 | Appen skal fungere på både iOS og Android |
| N5 | Ingen innlogging kreves i første versjon |
| N6 | Appen skal tydelig si at den ikke erstatter råd fra lege/trener |

---

## Logikken bak treningsplanen

Planen lages med **faste regler** basert på vanlige treningsprinsipper. Det trengs ikke AI i første versjon.

### 1. Startpunkt

| Nivå | Startvolum per uke | Lengste tur i dag (antatt) | Foreslåtte økter/uke |
|------|-------------------|-----------------------------|----------------------|
| Nybegynner | 5–10 km (gå/jogg) | ~2 km | 3 |
| Litt trent | 15–20 km | ~5 km | 3–4 |
| Godt trent | 25–40 km | ~10 km | 4–5 |

Hvis brukeren har oppgitt hvor langt de klarer å løpe i dag (F6), brukes det i stedet for antagelsen.

### 2. Progresjon

- Ukevolumet øker med **maks ca. 10 %** per uke (minst 0,5 km på langturen for de som starter lavt)
- **Hver 4. uke er en lettere uke** (ca. 70–80 % av forrige uke) for restitusjon
- **De siste 1–2 ukene før måldato trappes ned** (nedtrapping), så brukeren er uthvilt på dagen

### 3. Fordeling av økter i uka

- Omtrent **80 % rolig** og **20 % hardt** (intervall, tempo, bakker)
- Én **langtur** per uke, ca. 25–35 % av ukevolumet
- Nybegynnere får ingen harde økter de første ukene – bare gå/jogg og rolig
- Harde økter legges aldri to dager på rad
- Hviledager fordeles jevnt i uka

### 4. Tempo

- **Med måltid:** Appen regner ut konkurransetempo (min/km) og avleder tempo for hver økttype, f.eks. rolig = konkurransetempo + 60–90 sek/km
- **Uten måltid:** Appen bruker opplevd anstrengelse i stedet, f.eks. "rolig = du klarer å prate i hele setninger"

### 5. Realismesjekk

Appen regner ut om det er nok uker til å bygge opp fra startvolum til nødvendig volum med 10 %-regelen. Hvis ikke, vises en melding som:

> "Det er litt kort tid til å nå 21 km trygt. Vil du flytte datoen til 15. juni, eller sikte på 10 km først?"

Veiledende minimum antall uker:

| Distanse | Nybegynner | Litt trent | Godt trent |
|----------|-----------|------------|------------|
| 5 km | 8 | 4 | 2 |
| 10 km | 12 | 8 | 4 |
| Halvmaraton | 20 | 12 | 8 |
| Maraton | Ikke anbefalt | 20 | 14 |

---

## Økttyper

| Type | Beskrivelse | Eksempel |
|------|-------------|----------|
| **Gå/jogg** | Veksle mellom gange og rolig jogging. For nybegynnere | 8 × (1 min jogg + 2 min gange) |
| **Rolig tur** | Lett tempo, du skal kunne prate | 30 min rolig |
| **Langtur** | Ukas lengste tur, rolig tempo | 8 km rolig |
| **Intervall** | Korte, harde drag med pause | 6 × 400 m raskt, 90 sek pause |
| **Tempo** | Jevnt, "komfortabelt hardt" | 15 min i terskeltempo |
| **Bakkeintervall** | Korte drag oppover, gå/jogg ned | 8 × 45 sek oppover |
| **Hvile** | Ingen løping, evt. gåtur eller tøying | – |

Hver økt viser: oppvarming → hoveddel → nedjogg, samt varighet/distanse, tempo eller anstrengelse, og et kort tips.

---

## Datamodell

```text
Mål
  distanse_km
  maldato
  maltid (valgfri)
  okter_per_uke (valgfri)
  niva: nybegynner | litt_trent | godt_trent
  lengste_tur_na_km (valgfri)

Treningsplan
  id
  mal
  opprettet_dato
  godkjent: ja/nei
  okter: [Økt]

Økt
  dato
  type: gaa_jogg | rolig | langtur | intervall | tempo | bakke | hvile
  distanse_km eller varighet_min
  tempo eller anstrengelse
  oppvarming
  hoveddel
  nedjogg
  tips
  fullfort: ja/nei
```

---

## Utenfor omfang i MVP

- Andre treningsformer enn løping (styrke, sykkel, svømming)
- GPS-sporing og registrering av løpeturer
- Kobling til Strava, Garmin, Apple Health osv.
- Brukerkontoer og synkronisering mellom enheter
- AI-generert plan
- Automatisk justering av planen basert på gjennomførte økter

---

## Teknologi

| Del | Valg | Hvorfor |
|-----|------|---------|
| Rammeverk | **React Native med Expo** | Én kodebase for iOS og Android, enkel testing på egen telefon med Expo Go |
| Språk | **TypeScript** | Fanger feil tidlig, og datamodellen blir tydelig |
| Navigasjon | **Expo Router** | Filbasert navigasjon, følger med Expo-malen |
| Kalender | **react-native-calendars** | Ferdig månedskalender med markering av datoer |
| Lagring | **@react-native-async-storage/async-storage** | Lagrer planen lokalt på telefonen (N1, N5) |
| Datovelger | **@react-native-community/datetimepicker** | Innebygd datovelger på iOS og Android |
| Planlogikk | **Egen ren TypeScript-modul** (`src/plan/`) | Ingen avhengigheter til React Native, så den kan testes for seg selv |

### Mappestruktur

```text
app/                       # Skjermer (Expo Router)
  index.tsx                # Startside: "Lag ny plan" eller vis kalender
  mal.tsx                  # Skjema for mål (F1–F6)
  forslag.tsx              # Forhåndsvisning + Godkjenn/Endre (F8, F9)
  kalender.tsx             # Månedskalender (F10, F11)
  okt/[dato].tsx           # Detaljer for én økt (F12, F13)
src/
  plan/
    types.ts               # Datamodell
    dates.ts               # Datofunksjoner
    workouts.ts            # Innhold og tekst for hver økttype
    generatePlan.ts        # Reglene som lager planen
    generatePlan.test.ts   # Tester for reglene
    demo.ts                # Skriver ut en eksempelplan i terminalen
  storage.ts               # Lagre/hente plan med AsyncStorage
```

### Bruk av plan-generatoren

```ts
import { generatePlan } from '@/src/plan/generatePlan';

const plan = generatePlan({
  distanceKm: 10,
  goalDate: '2027-02-28',
  level: 'litt_trent',
  goalTimeMin: 55,        // valgfritt
  sessionsPerWeek: 3,     // valgfritt
  currentLongestKm: 5,    // valgfritt
});

if (!plan.feasibility.realistic) {
  // Vis plan.feasibility.message og tilby suggestedDate / suggestedDistanceKm
}
// plan.sessions → liste med økter som kan vises i kalenderen
```

Alle regler (startnivå, 10 %-regel, ukemønster, lette uker osv.) ligger som konstanter øverst i `generatePlan.ts`, så de er enkle å justere.

---

## Kom i gang

Krever [Node.js](https://nodejs.org) (versjon 20 eller nyere) og appen **Expo Go** på telefonen.

```bash
# 1. Lag prosjektet
npx create-expo-app@latest lopeplan
cd lopeplan

# 2. Installer pakkene appen trenger
npx expo install react-native-calendars @react-native-async-storage/async-storage @react-native-community/datetimepicker

# 3. Kopier inn src/plan/ fra dette repoet

# 4. Start appen og skann QR-koden med Expo Go
npx expo start
```

Teste planlogikken uten telefon:

```bash
npm install -D tsx
npx tsx --test src/plan/generatePlan.test.ts   # kjør testene
npx tsx src/plan/demo.ts                       # se en eksempelplan
```

---

## Videre utvikling

- **Tilpasning underveis:** Planen justeres hvis brukeren hopper over økter eller markerer en økt som for tung/lett
- **Synk med telefonens kalender** (Google Calendar / iOS Kalender)
- **Påminnelser** dagen før eller samme dag som en økt
- **Import av treningsdata** fra Strava/Garmin for å anslå nivå automatisk
- **AI-funksjoner:** Forklare økter i fritekst, svare på spørsmål ("jeg har vondt i leggen, hva gjør jeg?"), og lage mer fleksible planer
- **Flere treningsformer:** styrke, sykling, kombinasjoner

---

## Åpne spørsmål

- Skal brukeren kunne velge hvilke ukedager de vil trene?
- Skal treningsnivå bestemmes med spørsmål (f.eks. "Hvor mange ganger løp du forrige uke?") i stedet for at brukeren velger selv?
- Hva skjer hvis brukeren endrer målet midt i planen?

---

## Ansvarsfraskrivelse

Appen gir generelle treningsforslag og erstatter ikke råd fra lege, fysioterapeut eller trener. Ta kontakt med helsepersonell hvis du har skader eller helseplager.