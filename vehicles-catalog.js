'use strict';
/*
 * Catalog local de mărci / modele auto (populare în România).
 * Nu depinde de niciun serviciu extern. Format: "Marcă: Model AN_START-AN_SFÂRȘIT; ..."
 * (an sfârșit gol = încă în producție). Pentru a adăuga o marcă/un model, adaugă-l aici
 * sau din Admin → Mașini. Fiecare marcă primește automat și „Alt model”.
 */
const CATALOG_VERSION = 1;

const RAW = `
Alfa Romeo: 33 1983-1995; 145 1994-2001; 146 1994-2001; 147 2000-2010; 156 1997-2007; 159 2005-2012; 164 1987-1998; 166 1998-2007; 4C 2013-2020; Brera 2005-2010; Giulia 2015-; Giulietta 2010-2020; GT 2003-2010; GTV 1995-2006; Junior 2024-; Mito 2008-2018; Spider 1995-2010; Stelvio 2016-; Tonale 2022-
ARO: 10 1980-2006; 240 1972-2006; 243 1972-2006; 244 1972-2006; Spartana 1996-2006
Aston Martin: DB9 2004-2016; DB11 2016-; DBS 2007-; DBX 2020-; Vanquish 2001-; Vantage 2005-
Audi: 80 1972-1996; 90 1984-1991; 100 1968-1994; A1 2010-; A2 1999-2005; A3 1996-; A4 1994-; A4 Allroad 2009-; A5 2007-; A6 1994-; A6 Allroad 2000-; A7 2010-; A8 1994-; Cabriolet 1991-2000; Coupe 1980-1996; e-tron 2018-; e-tron GT 2021-; Q2 2016-; Q3 2011-; Q4 e-tron 2021-; Q5 2008-; Q7 2005-; Q8 2018-; R8 2006-2023; TT 1998-2023
Bentley: Bentayga 2015-; Continental GT 2003-; Flying Spur 2005-; Mulsanne 2010-2020
BMW: Seria 1 2004-; Seria 2 2014-; Seria 3 1975-; Seria 4 2013-; Seria 5 1972-; Seria 6 1976-; Seria 7 1977-; Seria 8 1989-; i3 2013-2022; i4 2021-; i5 2023-; i7 2022-; iX 2021-; iX1 2022-; iX3 2020-; X1 2009-; X2 2018-; X3 2003-; X4 2014-; X5 1999-; X6 2008-; X7 2018-; XM 2022-; Z3 1995-2002; Z4 2002-
BYD: Atto 3 2022-; Dolphin 2023-; e6 2010-; Han 2020-; Sealion 7 2024-; Seal 2023-; Seal U 2024-; Tang 2018-
Cadillac: ATS 2012-2019; BLS 2006-2009; CTS 2002-; Escalade 1998-; Lyriq 2022-; Seville 1975-2004; SRX 2004-2016; STS 2005-2011; XT4 2018-; XT5 2016-
Chevrolet: Aveo 2002-2020; Camaro 1967-; Captiva 2006-2018; Corvette 1953-; Cruze 2009-2016; Epica 2006-2011; Evanda 2004-2006; Kalos 2002-2008; Lacetti 2004-2013; Malibu 1997-; Matiz 2005-2015; Nubira 2003-2011; Orlando 2010-2018; Spark 2009-2022; Tacuma 2005-2008; Trailblazer 2002-; Trax 2013-
Chrysler: 300C 2004-2017; 300M 1998-2004; Crossfire 2003-2008; Grand Voyager 1988-2016; Neon 1994-2005; Pacifica 2004-; PT Cruiser 2000-2010; Sebring 1995-2010; Stratus 1995-2006; Town & Country 1990-2016; Voyager 1988-2016
Citroen: 2CV 1948-1990; AX 1986-1998; Berlingo 1996-; BX 1982-1994; C-Crosser 2007-2012; C-Elysee 2012-; C1 2005-2022; C2 2003-2009; C3 2002-; C3 Aircross 2017-; C3 Picasso 2008-2017; C4 2004-; C4 Cactus 2014-2020; C4 Grand Picasso 2006-2022; C4 Picasso 2006-2018; C4 X 2022-; C5 2001-; C5 Aircross 2018-; C5 X 2021-; C6 2005-2012; C8 2002-2014; Evasion 1994-2002; Jumper 1994-; Jumpy 1994-; Nemo 2007-2017; Saxo 1996-2003; SpaceTourer 2016-; Xantia 1993-2001; XM 1989-2000; Xsara 1997-2006; Xsara Picasso 1999-2012; ZX 1991-1998
Cupra: Ateca 2018-; Born 2021-; Formentor 2020-; Leon 2020-; Tavascan 2024-; Terramar 2024-
Dacia: 1100 1968-1972; 1300 1969-1979; 1310 1979-2004; 1410 1993-2004; Pick-Up 1304 1975-2006; Nova 1995-2000; SuperNova 2000-2003; Solenza 2003-2005; Logan 2004-; Logan MCV 2006-; Logan Pick-Up 2008-; Sandero 2008-; Sandero Stepway 2009-; Duster 2010-; Dokker 2012-2021; Lodgy 2012-2022; Spring 2021-; Jogger 2022-; Bigster 2025-
Daewoo: Cielo 1994-1997; Espero 1991-1999; Evanda 2002-2006; Kalos 2002-2008; Lacetti 2002-2008; Lanos 1997-2002; Leganza 1997-2002; Matiz 1998-2004; Nexia 1994-2016; Nubira 1997-2003; Tacuma 2000-2008; Tico 1991-2001
Daihatsu: Applause 1989-2000; Charade 1977-2000; Copen 2002-2012; Cuore 1980-2013; Feroza 1988-1998; Gran Move 1996-2002; Materia 2006-2012; Sirion 1998-2018; Terios 1997-2022; YRV 2000-2005
Dodge: Avenger 2007-2014; Caliber 2006-2012; Caravan 1983-2020; Challenger 2008-; Charger 2006-; Dakota 1987-2011; Durango 1998-; Journey 2008-2020; Magnum 2005-2008; Neon 1994-2005; Nitro 2007-2011; Ram 1981-; Viper 1992-2017
DS: DS 3 2010-; DS 3 Crossback 2018-; DS 4 2011-; DS 5 2011-2018; DS 7 2018-; DS 9 2021-
Ferrari: 458 2009-2015; 488 2015-2020; 812 2017-; California 2008-2017; F8 2019-2023; Portofino 2017-2023; Roma 2020-
Fiat: 126 1972-2000; 500 2007-; 500L 2012-; 500X 2014-; 600 2023-; Albea 2002-2012; Brava 1995-2001; Bravo 1995-2014; Cinquecento 1991-1998; Croma 1985-2010; Doblo 2000-; Ducato 1981-; Fiorino 2007-; Freemont 2011-2016; Grande Punto 2005-2012; Idea 2003-2012; Linea 2007-2016; Marea 1996-2002; Multipla 1998-2010; Palio 1996-2020; Panda 1980-; Punto 1993-2018; Punto Evo 2009-2012; Qubo 2008-; Scudo 1995-2022; Sedici 2006-2014; Seicento 1998-2010; Stilo 2001-2010; Talento 2016-2021; Tempra 1990-1998; Tipo 1988-; Ulysse 1994-2010; Uno 1983-2013
Ford: B-Max 2012-2017; C-Max 2003-2019; Capri 1969-1986; Cougar 1998-2001; EcoSport 2013-; Edge 2015-; Escort 1968-2000; Explorer 1991-; Fiesta 1976-2023; Focus 1998-; Fusion 2002-2012; Galaxy 1995-2023; Granada 1972-1994; Ka 1996-2021; Kuga 2008-; Maverick 1993-; Mondeo 1993-2022; Mustang 1964-; Mustang Mach-E 2020-; Orion 1983-1993; Probe 1992-1998; Puma 1997-; Ranger 1998-; S-Max 2006-2023; Scorpio 1985-1998; Sierra 1982-1993; Taunus 1970-1982; Tourneo Connect 2002-; Tourneo Courier 2014-; Tourneo Custom 2012-; Transit 1965-; Transit Connect 2002-; Transit Courier 2014-; Transit Custom 2012-
Honda: Accord 1976-; Civic 1972-; CR-V 1995-; CR-Z 2010-2016; e 2020-2023; FR-V 2004-2009; HR-V 1998-; Insight 1999-; Integra 1985-2006; Jazz 2001-; Legend 1985-2012; NSX 1990-2022; Prelude 1978-2001; S2000 1999-2009; Stream 2001-2014; ZR-V 2023-
Hyundai: Accent 1994-; Atos 1997-2008; Bayon 2021-; Coupe 1996-2009; Elantra 1990-; Galloper 1991-2003; Getz 2002-2011; H-1 1997-; H100 1993-; i10 2007-; i20 2008-; i30 2007-; i40 2011-2019; Ioniq 2016-2022; Ioniq 5 2021-; Ioniq 6 2022-; ix20 2010-2019; ix35 2010-2015; Kona 2017-; Lantra 1990-2000; Matrix 2001-2010; Santa Fe 2000-; Sonata 1985-; Terracan 2001-2007; Trajet 1999-2008; Tucson 2004-; Veloster 2011-2021
Infiniti: EX 2008-2013; FX 2003-2013; G 2003-2013; M 2005-2013; Q30 2015-2019; Q50 2013-; Q60 2013-; Q70 2013-2019; QX50 2013-; QX70 2013-2019; QX80 2010-
Isuzu: Bighorn 1981-1991; D-Max 2002-; MU-X 2013-; Rodeo 1988-2004; Trooper 1981-2002
Iveco: Daily 1978-; Massif 2008-2011
Jaguar: E-Pace 2017-; F-Pace 2016-; F-Type 2013-2024; I-Pace 2018-; S-Type 1999-2008; X-Type 2001-2009; XE 2015-2024; XF 2008-2024; XJ 1968-2019; XK 1996-2014
Jeep: Avenger 2023-; Cherokee 1984-; Commander 2006-2010; Compass 2006-; Gladiator 2019-; Grand Cherokee 1992-; Patriot 2007-2017; Renegade 2014-; Wrangler 1986-
Kia: Carens 1999-2019; Carnival 1998-; Ceed 2006-; Cerato 2004-; Clarus 1996-2001; EV6 2021-; EV9 2023-; Magentis 2000-2010; Niro 2016-; Opirus 2003-2010; Optima 2010-; Picanto 2004-; Pride 1987-2000; ProCeed 2018-; Rio 2000-; Sephia 1992-2003; Shuma 1997-2004; Sorento 2002-; Soul 2008-; Sportage 1993-; Stinger 2017-2023; Stonic 2017-; Venga 2009-2019; XCeed 2019-
Lada: 110 1995-2014; 2105 1980-2010; 2107 1982-2012; Granta 2011-; Kalina 2004-2018; Largus 2012-; Niva 1977-; Priora 2007-2018; Riva 1980-2012; Samara 1984-2013; Vesta 2015-
Lamborghini: Aventador 2011-2022; Gallardo 2003-2013; Huracan 2014-; Revuelto 2023-; Urus 2018-
Lancia: Dedra 1989-2000; Delta 1979-; Kappa 1994-2000; Lybra 1999-2005; Musa 2004-2012; Phedra 2002-2010; Thema 1984-; Thesis 2001-2009; Voyager 2011-2014; Y 1995-2003; Y10 1985-1995; Ypsilon 2003-
Land Rover: Defender 1983-; Discovery 1989-; Discovery Sport 2014-; Freelander 1997-2014; Range Rover 1970-; Range Rover Evoque 2011-; Range Rover Sport 2005-; Range Rover Velar 2017-
Lexus: CT 2011-2022; ES 1989-; GS 1993-2020; GX 2002-; IS 1999-; LC 2017-; LS 1989-; LX 1996-; NX 2014-; RC 2014-; RX 1998-; RZ 2022-; UX 2018-
Lotus: Elise 1996-2021; Evora 2009-2021; Exige 2000-2021
Maserati: 3200 GT 1998-2002; Coupe 2001-2007; Ghibli 1992-; GranCabrio 2010-; Grecale 2022-; GranTurismo 2007-; Levante 2016-; MC20 2020-; Quattroporte 1963-; Spyder 2001-2007
Mazda: 2 2003-; 3 2003-; 5 2005-2018; 6 2002-; 121 1987-2003; 323 1977-2003; 626 1982-2002; CX-3 2015-; CX-30 2019-; CX-5 2012-; CX-60 2022-; CX-7 2006-2012; CX-9 2007-; MPV 1988-2016; MX-30 2020-; MX-5 1989-; Premacy 1999-2005; RX-8 2003-2012; Tribute 2000-2011; Xedos 6 1992-1999
Mercedes-Benz: 190 1982-1993; AMG GT 2014-; Citan 2012-; Clasa A 1997-; Clasa B 2005-; Clasa C 1993-; Clasa E 1993-; Clasa G 1979-; Clasa M 1997-2015; Clasa R 2005-2017; Clasa S 1972-; Clasa V 1996-; CLA 2013-; CLC 2008-2011; CLK 1997-2010; CLS 2004-; EQA 2021-; EQB 2021-; EQC 2019-2023; EQE 2022-; EQS 2021-; EQV 2020-; GL 2006-2015; GLA 2013-; GLB 2019-; GLC 2015-; GLE 2015-; GLK 2008-2015; GLS 2015-; SL 1954-; SLC 2016-2020; SLK 1996-2016; Sprinter 1995-; Vaneo 2001-2005; Viano 2003-2014; Vito 1996-; X-Class 2017-2020
MG: 3 2008-; 4 2022-; 5 2020-; EHS 2019-; HS 2018-; Marvel R 2021-; MGF 1995-2002; TF 2002-2005; ZR 2001-2005; ZS 2017-; ZT 2001-2005
Mini: Cabrio 2004-; Clubman 2007-; Cooper 2001-; Countryman 2010-; Coupe 2011-2015; One 2001-; Paceman 2012-2016; Roadster 2012-2015
Mitsubishi: ASX 2010-; Carisma 1995-2004; Colt 1978-2012; Eclipse Cross 2017-; Galant 1969-2012; Grandis 2003-2011; i-MiEV 2009-2021; L200 1978-; Lancer 1973-2017; Outlander 2001-; Pajero 1982-2021; Pajero Pinin 1999-2007; Pajero Sport 1996-; Space Star 1998-; Space Wagon 1984-2004
Nissan: 350Z 2002-2009; 370Z 2008-2020; Almera 1995-2006; Almera Tino 2000-2006; Ariya 2021-; Cabstar 1981-; GT-R 2007-; Interstar 2002-; Juke 2010-; Kubistar 2003-2008; Leaf 2010-; Maxima 1988-2006; Micra 1982-; Murano 2003-; Navara 1986-; Note 2004-2020; NV200 2009-; NV400 2010-; Pathfinder 1985-; Patrol 1951-; Pixo 2009-2013; Primastar 2001-2014; Primera 1990-2008; Pulsar 2014-2018; Qashqai 2007-; Qashqai+2 2008-2013; Sunny 1982-2006; Terrano 1985-2006; Tiida 2004-2013; Townstar 2021-; X-Trail 2001-
Oltcit: Axel 1992-1996; Club 1981-1991
Opel: Adam 2012-2019; Agila 2000-2014; Ampera 2011-2015; Antara 2006-2017; Astra 1991-; Calibra 1990-1997; Cascada 2013-2019; Combo 1986-; Corsa 1982-; Corsa-e 2020-; Crossland 2017-; Frontera 1991-; Grandland 2017-; Insignia 2008-; Kadett 1962-1991; Karl 2015-2019; Meriva 2002-2017; Mokka 2012-; Mokka-e 2020-; Monterey 1991-1998; Movano 1998-; Omega 1986-2003; Rekord 1953-1986; Signum 2003-2008; Sintra 1996-1999; Tigra 1994-2009; Vectra 1988-2008; Vivaro 2001-; Zafira 1999-; Zafira Life 2019-
Peugeot: 106 1991-2003; 107 2005-2014; 108 2014-2021; 205 1983-1998; 206 1998-2012; 207 2006-2014; 208 2012-; 301 2012-; 306 1993-2002; 307 2000-2008; 308 2007-; 405 1987-1999; 406 1995-2004; 407 2004-2011; 408 2010-; 508 2010-; 607 1999-2010; 807 2002-2014; 2008 2013-; 3008 2009-; 4007 2007-2012; 4008 2012-2017; 5008 2009-; Bipper 2008-2018; Boxer 1994-; Expert 1995-; iOn 2010-2018; Partner 1996-; RCZ 2010-2015; Rifter 2018-; Traveller 2016-
Porsche: 718 Boxster 2016-; 718 Cayman 2016-; 911 1964-; 924 1976-1988; 928 1977-1995; 944 1982-1991; 968 1991-1995; Boxster 1996-2016; Cayenne 2002-; Cayman 2005-2016; Macan 2014-; Panamera 2009-; Taycan 2019-
Renault: 4 1961-1994; 5 1972-1996; 9 1981-1997; 11 1981-1989; 19 1988-2000; 21 1986-1994; 25 1984-1992; Arkana 2019-; Austral 2022-; Captur 2013-; Clio 1990-; Espace 1984-; Express 1985-; Fluence 2009-2017; Grand Scenic 2004-; Kadjar 2015-2022; Kangoo 1997-; Koleos 2008-; Laguna 1993-2015; Latitude 2010-2015; Master 1980-; Megane 1995-; Megane E-Tech 2022-; Modus 2004-2012; Rafale 2023-; Safrane 1992-2000; Scenic 1996-; Symbol 1999-2013; Talisman 2015-2022; Trafic 1980-; Twingo 1992-; Twizy 2012-; Vel Satis 2002-2009; Wind 2010-2013; Zoe 2012-2024
Rolls-Royce: Cullinan 2018-; Dawn 2015-2022; Ghost 2009-; Phantom 2003-; Wraith 2013-2023
Rover: 25 1999-2005; 45 1999-2005; 75 1998-2005; 200 1984-1999; 400 1990-2000; 600 1993-1999; 800 1986-1999; Streetwise 2003-2005
Saab: 900 1978-1998; 9000 1984-1998; 9-3 1998-2014; 9-5 1997-2012
Seat: Alhambra 1996-2020; Altea 2004-2015; Arona 2017-; Arosa 1997-2004; Ateca 2016-; Cordoba 1993-2009; Exeo 2008-2013; Ibiza 1984-; Inca 1995-2003; Leon 1999-; Mii 2011-2021; Tarraco 2018-; Toledo 1991-2019
Skoda: 120 1976-1990; Citigo 2011-2019; Elroq 2024-; Enyaq 2020-; Fabia 1999-; Favorit 1987-1995; Felicia 1994-2001; Kamiq 2019-; Karoq 2017-; Kodiaq 2016-; Octavia 1996-; Rapid 2012-2023; Roomster 2006-2015; Scala 2019-; Superb 2001-; Yeti 2009-2017
Smart: Forfour 2004-; Fortwo 1998-; Roadster 2003-2005
SsangYong: Actyon 2005-; Korando 1983-; Kyron 2005-2014; Musso 1993-; Rexton 2001-; Rodius 2004-2019; Tivoli 2015-; Torres 2022-; XLV 2016-
Subaru: BRZ 2012-; Crosstrek 2023-; Forester 1997-; Impreza 1992-; Justy 1984-; Legacy 1989-; Levorg 2014-; Outback 1994-; Solterra 2022-; Tribeca 2005-2014; Trezia 2011-2016; XV 2012-2023
Suzuki: Across 2020-; Alto 1979-; Baleno 1995-; Celerio 2014-; Grand Vitara 1998-2018; Ignis 2000-; Jimny 1970-; Kizashi 2010-2016; Liana 2001-2007; S-Cross 2013-; Samurai 1981-2004; Splash 2008-2014; Swace 2020-; Swift 1983-; SX4 2006-2016; Vitara 1988-; Wagon R 1993-
Tesla: Cybertruck 2023-; Model 3 2017-; Model S 2012-; Model X 2015-; Model Y 2020-; Roadster 2008-2012
Toyota: 4Runner 1984-; Auris 2006-2018; Avensis 1997-2018; Avensis Verso 2001-2009; Aygo 2005-; Aygo X 2022-; bZ4X 2022-; C-HR 2016-; Camry 1982-; Carina E 1992-1997; Celica 1970-2006; Corolla 1966-; Corolla Verso 2001-2009; GT86 2012-2021; Highlander 2000-; Hilux 1968-; Land Cruiser 1951-; MR2 1984-2007; Previa 1990-2006; Prius 1997-; Prius Plus 2011-2020; Proace 2013-; Proace City 2019-; Proace Verso 2016-; RAV4 1994-; Starlet 1978-1999; Supra 1978-; Urban Cruiser 2009-; Verso 2009-2018; Verso-S 2010-2016; Yaris 1999-; Yaris Cross 2020-
Trabant: 601 1963-1991; 1.1 1989-1991
Volkswagen: Amarok 2010-; Arteon 2017-; Beetle 1938-2019; Bora 1998-2005; Caddy 1980-; California 1990-; Caravelle 1990-; CC 2008-2016; Corrado 1988-1995; Crafter 2006-; Eos 2006-2015; Fox 2005-2011; Golf 1974-; Golf Plus 2005-2014; Golf Sportsvan 2014-2020; ID.3 2020-; ID.4 2021-; ID.5 2021-; ID.7 2023-; ID. Buzz 2022-; Jetta 1979-; Lupo 1998-2005; Multivan 1990-; Passat 1973-; Passat CC 2008-2012; Phaeton 2002-2016; Polo 1975-; Scirocco 1974-2017; Sharan 1995-2022; T-Cross 2018-; T-Roc 2017-; Taigo 2021-; Tiguan 2007-; Touareg 2002-; Touran 2003-; Transporter 1950-; Up! 2011-2023; Vento 1991-1998
Volvo: 240 1974-1993; 850 1991-1997; 940 1990-1998; 960 1990-1998; C30 2006-2013; C40 2021-; C70 1997-2013; EX30 2023-; S40 1995-2012; S60 2000-; S70 1996-2000; S80 1998-2016; S90 1996-; V40 1995-2019; V50 2004-2012; V60 2010-; V70 1996-2016; V90 1997-; XC40 2017-; XC60 2008-; XC70 1997-2016; XC90 2002-
Wartburg: 353 1966-1989; 1.3 1988-1991
`;

const MODEL_RE = /^(.+?)\s+(\d{4})-(\d{4})?$/;

function parse() {
  const rows = [];
  for (const line of RAW.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const i = t.indexOf(':');
    const make = t.slice(0, i).trim();
    for (const part of t.slice(i + 1).split(';')) {
      const p = part.trim();
      if (!p) continue;
      const m = MODEL_RE.exec(p);
      rows.push({
        make,
        model: m ? m[1].trim() : p,
        year_from: m ? Number(m[2]) : null,
        year_to: m && m[3] ? Number(m[3]) : null,
        kind: /^(Daily|Massif|Ducato|Jumper|Boxer|Master|Movano|Sprinter|Crafter|Transit|Transporter|Vito|Trafic|Vivaro|Expert|Jumpy|Scudo|Interstar|Primastar|NV400)/.test(m ? m[1] : p) ? 'van' : 'car'
      });
    }
    rows.push({ make, model: 'Alt model', year_from: null, year_to: null, kind: 'car' });
  }
  rows.push({ make: 'Altă marcă', model: 'Alt model', year_from: null, year_to: null, kind: 'car' });
  return rows;
}

const CURATED_VEHICLES = parse();

module.exports = { CATALOG_VERSION, CURATED_VEHICLES };
