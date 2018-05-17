import { RestProvider } from './../rest/rest';
import { HttpClient } from '@angular/common/http';
export abstract class Setup {

  constructor(public http: HttpClient, public restProvider: RestProvider) {
  }

  projetarVolume(ativo: any, tipo: string) {
    let ultimoCandle: any = {};
    for (const key in ativo.diario) {
      ultimoCandle = ativo.diario[key];
      break;
    }
    let percentual = this.getPercentualTranscorridoDePregao(ativo.ultimaLeituraDiario, tipo);
    if (percentual == 0) {
      ativo.volumeProjetado = 0;
      return;
    }
    if (percentual > 0 && percentual < 1) {
      ativo.volumeProjetado = Number((((ultimoCandle.volume / percentual) / ativo.mediaVolume21) - 1) * 100);
    } else {
      ativo.volumeProjetado = Number(((ultimoCandle.volume / ativo.mediaVolume21) - 1) * 100);
    }
    ativo.volumeProjetado = Math.round(ativo.volumeProjetado);
  }
  
  getPercentualTranscorridoDePregao(leitura: Date, tipo: string) {
    leitura = new Date(leitura);
    let inicioPregao: Date = this.getInicioPregaoBovepa();
    let minutos: number = Number(((leitura.getTime() - inicioPregao.getTime()) / (1000 * 60)).toFixed(1));
    if (minutos < 0) {
      return 0;
    } else if (minutos > 420) {
      return 1;
    }
    return minutos / 420;

  }

  getInicioPregaoBovepa() {
    let data = this.restProvider.getUltimoDiaPregao();
    // define a hora de inicio do pregao
    data.setHours(10);
    data.setMinutes(0);
    data.setSeconds(0);
    data.setMilliseconds(0);
    return data;
  }

  getInicioPregaoNasdaq() {
    let data = this.restProvider.getUltimoDiaPregao();
    // define a hora de inicio do pregao
    data.setHours(10);
    data.setMinutes(0);
    data.setSeconds(0);
    data.setMilliseconds(0);
    return data;
  }

  verificarTendencia(ativo: any) {

    let valoresFechamento: Array<Number> = [];
    let valoresVolume: Array<Number> = [];
    let candleHoje = null;
    for (const key in ativo.diario) {
      valoresFechamento.push(Number(ativo.diario[key].close));
      valoresVolume.push(Number(ativo.diario[key].volume));
      if (!candleHoje) {
        candleHoje = ativo.diario[key];
      }
    }
    if (valoresFechamento.length < 202) {
      console.log(`ativo sem 200 candles`, ativo.symbol, valoresFechamento.length);
      return;
    }

    ativo.media21Hoje = Number(valoresFechamento.slice(0, 21).reduce((v: number, i: number) => (v + i))) / 21;
    ativo.media50Hoje = Number(valoresFechamento.slice(0, 50).reduce((v: number, i: number) => (v + i))) / 50;
    ativo.media200Hoje = Number(valoresFechamento.slice(0, 200).reduce((v: number, i: number) => (v + i))) / 200;
    ativo.media21Ontem = Number(valoresFechamento.slice(1, 22).reduce((v: number, i: number) => (v + i))) / 21;
    ativo.media50Ontem = Number(valoresFechamento.slice(1, 51).reduce((v: number, i: number) => (v + i))) / 50;
    ativo.media200Ontem = Number(valoresFechamento.slice(1, 201).reduce((v: number, i: number) => (v + i))) / 200;
    ativo.mediaVolume21 = Number(valoresVolume.slice(1, 22).reduce((v: number, i: number) => (v + i))) / 21;

    let fatoresTendenciaAlta: number = 0;
    if (candleHoje.close > ativo.media21Hoje) {
      // precos acima da mm21
      fatoresTendenciaAlta++;
    }
    if (ativo.media21Hoje > ativo.media21Ontem) {
      // mm21 ascendente
      fatoresTendenciaAlta++;
      if (ativo.media21Hoje > ativo.media50Hoje) {
        // mm21 ascendente e acima da mm50
        fatoresTendenciaAlta++;
      }
    }
    if (ativo.media50Hoje > ativo.media50Ontem && ativo.media200Hoje > ativo.media200Ontem &&
      ativo.media50Hoje > ativo.media200Hoje) {
      // mm50 asc. e acima da mm200 asc.
      fatoresTendenciaAlta++;
    }

    let fatoresTendenciaBaixa: number = 0;
    if (candleHoje.close < ativo.media21Hoje) {
      // precos abaixo da mm21
      fatoresTendenciaBaixa++;
    }
    if (ativo.media21Hoje < ativo.media21Ontem) {
      // mm21 descendente
      fatoresTendenciaBaixa++;
      if (ativo.media21Hoje < ativo.media50Hoje) {
        // mm21 descendente e abaixo da mm50
        fatoresTendenciaBaixa++;
      }
    }
    if (ativo.media50Hoje < ativo.media50Ontem && ativo.media200Hoje < ativo.media200Ontem &&
      ativo.media50Hoje < ativo.media200Hoje) {
      // mm50 desc. e abaixo da mm200 desc.
      fatoresTendenciaBaixa++;
    }

    ativo.fatoresTendenciaBaixa = fatoresTendenciaBaixa;
    ativo.fatoresTendenciaAlta = fatoresTendenciaAlta;



  }

}