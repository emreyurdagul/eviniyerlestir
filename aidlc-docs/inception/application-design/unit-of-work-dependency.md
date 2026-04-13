# EviniYerlestir - Unite Bagimlilik Matrisi

## Bagimlilik Tablosu

| Unite | U1 Core | U2 Scene | U3 Room | U4 Furniture | U5 UI | U6 Serial |
|-------|:-------:|:--------:|:-------:|:------------:|:-----:|:---------:|
| **U1 Core** | - | | | | | |
| **U2 Scene** | **X** | - | | | | |
| **U3 Room** | **X** | **X** | - | | | |
| **U4 Furniture** | **X** | **X** | | - | | |
| **U5 UI** | **X** | | | *(X)* | - | |
| **U6 Serial** | **X** | | | | | - |

**X** = dogrudan bagimliligi var
*(X)* = zayif bagimlilik (registry'den katalog bilgisi, compile-time)

## Kritik Yol

```
U1 ──► U2 ──► U3
             ──► U4 ──► U5 (registry bilgisi)
```

U5 (UI), U4'un registry.ts dosyasina bagimli (katalog listesi icin).
Ancak U5 development sirasinda mock katalog ile baslanabilir, U4 tamamlaninca gercek registry baglantisi yapilir.

## Dalga Bazli Paralel Plan

| Dalga | Uniteler | Onkosul | Paralel mi? |
|-------|----------|---------|:-----------:|
| 1 | U1 Core | - | Tek |
| 2 | U2 Scene, U5 UI*, U6 Serial | U1 tamam | 3 paralel |
| 3 | U3 Room, U4 Furniture | U1+U2 tamam | 2 paralel |
| 4 | Entegrasyon (App.tsx) | Tumu tamam | Tek |

*U5 mock katalog ile baslar, U4 tamamlaninca gercek registry baglanir.

## Iletisim Paternleri

| Kaynak | Hedef | Patern |
|--------|-------|--------|
| U5 → U1 | Store action cagirma | Zustand hook (useStore) |
| U3/U4 → U1 | State okuma/yazma | Zustand hook |
| U2 → U1 | Kamera state | Zustand hook |
| U6 → U1 | Layout data import/export | Fonksiyon cagirisi |
| U5 → U4 | Katalog listesi | Registry.getCatalog() |
| U3/U4 → U2 | 3D sahne icinde render | R3F children |
