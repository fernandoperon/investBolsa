import { RestProvider } from './../rest/rest';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Setup } from './setup';

/*
  Generated class for the SwingtradeSetupProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SwingtradeSetupProvider extends Setup {

 
  constructor(public http: HttpClient, public restProvider: RestProvider) {
    super(http, restProvider);
  }

  verificarSetup(ativo, tipo: string) {
    if (ativo) {
      this.restProvider.ordernarSeries(ativo.diario);
      this.verificarFaltaCandle(ativo);
      this.verificarGap(ativo);
      this.verificarRompimentos(ativo);
      this.verificarTendencia(ativo);
      this.projetarVolume(ativo, tipo);
      this.verificarContraTendencia(ativo);
      this.calcularVolatilidadeHistorica(ativo);
      this.stopMaximo(ativo);
      this.distanciaMedia21(ativo);
      this.verificarMartelo(ativo);
    }
  }

  verificarGap(ativo: any) {

    let diaPegrao = this.restProvider.getUltimoDiaPregao();
    let diaPegraoStr = this.restProvider.formataData(diaPegrao);
    let penultimoDiaPregao = this.restProvider.getPenultimoDiaPregao(diaPegrao);
    let penultimoDiaPregaoStr = this.restProvider.formataData(penultimoDiaPregao);

    let candleDia = ativo.diario[diaPegraoStr];
    let candlePenultimoDia = ativo.diario[penultimoDiaPregaoStr];

    if (!candleDia || !candlePenultimoDia) {
      return;
    }
    let tamanhoGap: number = Number(((candleDia.open / candlePenultimoDia.close) - 1) * 100);
    let variacao: number = Number(((candleDia.close / candlePenultimoDia.close) - 1) * 100);
    ativo.gap = tamanhoGap.toFixed(1);
    ativo.variacao = variacao.toFixed(2);
  }

 
  private calcularTamanhoCandle(candle: any) {
    return (candle.high / candle.close) - 1;
  }

  verificarContraTendencia(ativo: any) {
    let ultimoCandle: any = {};
    for (const key in ativo.diario) {
      ultimoCandle = ativo.diario[key];
      break;
    }
    if (!ultimoCandle.bbands) {
      return;
    }
    if (ultimoCandle.bbands.lower > ultimoCandle.high ||
      ultimoCandle.bbands.upper < ultimoCandle.lower) {
      ativo.contraTendencia = true;
    }
  }

  verificarRompimentos(ativo: any) {
    ativo.maxima21 = {}
    ativo.maxima50 = {};
    ativo.maxima200 = {};
    ativo.maximaGeral = {};
    ativo.minima21 = {};
    ativo.minima50 = {};
    ativo.minima200 = {};
    ativo.minimaGeral = {};
    let candleHoje = null;
    let index = 1;
    for (const key in ativo.diario) {
      let diaPegrao: Date = this.restProvider.getUltimoDiaPregao();
      let diaPregaoStr: string = this.restProvider.formataData(diaPegrao);

      if (diaPregaoStr == key) {
        candleHoje = ativo.diario[key];
        continue;
      }

      let low = ativo.diario[key].low;
      let high = ativo.diario[key].high;
      if (index < 22) {
        if (!ativo.minima21.value || low < ativo.minima21.value) {
          ativo.minima21.value = low;
          ativo.minima21.key = key;
        }
        if (!ativo.maxima21.value || high > ativo.maxima21.value) {
          ativo.maxima21.value = high;
          ativo.maxima21.key = key;
        }
      } else if (index < 51) {
        if (!ativo.minima50.value || low < ativo.minima50.value) {
          ativo.minima50.value = low;
          ativo.minima50.key = key;
        }
        if (!ativo.maxima50.value || high > ativo.maxima50.value) {
          ativo.maxima50.value = high;
          ativo.maxima50.key = key;
        }
      } else if (index < 201) {
        if (!ativo.minima200.value || low < ativo.minima200.value) {
          ativo.minima200.value = low;
          ativo.minima200.key = key;
        }
        if (!ativo.maxima200.value || high > ativo.maxima200.value) {
          ativo.maxima200.value = high;
          ativo.maxima200.key = key;
        }
      } else {
        if (!ativo.minimaGeral.value || low < ativo.minimaGeral.value) {
          ativo.minimaGeral.value = low;
          ativo.minimaGeral.key = key;
        }
        if (!ativo.maximaGeral.value || high > ativo.maximaGeral.value) {
          ativo.maximaGeral.value = high;
          ativo.maximaGeral.key = key;
        }

      }
      index++;
    }
    if (!candleHoje) {
      return;
    }

    //verifica se houve o rompimento
    if (candleHoje.close > candleHoje.open) {
      // ativo em alta hoje
      if (candleHoje.close > ativo.maxima21.value) {
        ativo.rompimentoMaxima21 = true;
      }
      if (candleHoje.close > ativo.maxima50.value) {
        ativo.rompimentoMaxima50 = true;
      }
      if (candleHoje.close > ativo.maxima200.value) {
        ativo.rompimentoMaxima200 = true;
      }
      if (candleHoje.close > ativo.maximaGeral.value) {
        ativo.rompimentoMaximaGeral = true;
      }
    } else {
      // ativo em baixa hoje
      if (candleHoje.close < ativo.minima21.value) {
        ativo.rompimentoMinima21 = true;
      }
      if (candleHoje.close < ativo.minima50.value) {
        ativo.rompimentoMinima50 = true;
      }
      if (candleHoje.close < ativo.minima200.value) {
        ativo.rompimentoMinima200 = true;
      }
      if (candleHoje.close < ativo.minimaGeral.value) {
        ativo.rompimentoMinimaGeral = true;
      }
    }

    // se não houve rompimento nem pra cima nem pra baixo, então verifica se
    // está proximo de um rompimento.
    if (!ativo.rompimentoMaxima21 && !ativo.rompimentoMinima21 && !ativo.rompimentoMaxima50 &&
      !ativo.rompimentoMinima50) {
      let closeAumentado = candleHoje.close * 1.04;
      let closeDiminuido = candleHoje.close * 0.96;
      if (closeAumentado > ativo.maxima21.value && closeAumentado > ativo.maxima50.value) {
        ativo.rompimentoProximo = true;
      } else if (closeDiminuido < ativo.minima21.value && closeDiminuido < ativo.minima50.value) {
        ativo.rompimentoProximo = true;
      }
    }
  }

  distanciaMedia21(ativo: any) {
    let ultimoCandle = this.getUltimoCandleDiario(ativo);
    let volatidade = ativo.volatilidadeMedia * 0.3;
    if (ultimoCandle.close > ativo.media21Hoje) {
      ativo.distanciaMedia21 = (ultimoCandle.close / ativo.media21Hoje) - 1;
    } else {
      ativo.distanciaMedia21 = 1 - (ultimoCandle.close / ativo.media21Hoje);
    }
    if (ativo.distanciaMedia21 > volatidade) {
      ativo.distanciaMedia21Grande = true;
    } else {
      ativo.distanciaMedia21Grande = false;
    }

  }

  public getUltimoCandleDiario(ativo: any) {
    for (const key in ativo.diario) {
      return ativo.diario[key];
    }
  }

  stopMaximo(ativo: any) {
    let ultimoCandle = this.getUltimoCandleDiario(ativo);
    if (ativo.variacao > 0) {
      ativo.stopMaximo = ultimoCandle.close - (ultimoCandle.close * ativo.volatilidadeMedia * 0.3);
    } else {
      ativo.stopMaximo = ultimoCandle.close + (ultimoCandle.close * ativo.volatilidadeMedia * 0.3);
    }
    ativo.stopMaximo = ativo.stopMaximo.toFixed(2);
  }

  verificarFaltaCandle(ativo: any) {
    ativo.faltaCandle = [];
    let data = new Date();
    let index: number = 0;
    while (index <= 300) {
      index += 1;
      if (!this.restProvider.isBolsaFechada(data)) {
        let dataStr = this.restProvider.formataData(data);
        if (!ativo.diario[dataStr]) {
          ativo.faltaCandle.push(dataStr);
        }
      }
      data.setDate(data.getDate() - 1);
    }
  }

  calcularVolatilidadeHistorica(ativo: any) {
    let ultimos: Array<Object> = [];
    let precos: Array<number> = [];
    let index: number = 0;
    if (Object.keys(ativo.diario).length < 42) {
      return;
    }
    for (const key in ativo.diario) {
      // obtem os ultimos 42 candles
      index++;
      ultimos.push(ativo.diario[key]);
      if (index == 43) break;
    }
    for (let index = 0; index < ultimos.length; index++) {
      const atual: any = ultimos[index];
      precos.push(atual.close);
      if (index == 42) {
        atual.variacao = 0;
        atual.logaritmoVariacao = 0;
        break;
      }
      const anterior: any = ultimos[index + 1];
      atual.variacao = atual.close / anterior.close;
      atual.logaritmoVariacao = Math.log(atual.variacao);
    }
    let valoresVh = [];
    for (let index = 0; index < 21; index++) {
      const atual: any = ultimos[index];
      let logaritmos: Array<number> = ultimos.slice(index, index + 21).map((item: any) => { return item.logaritmoVariacao });
      atual.vh = this.standardDeviation(logaritmos) * Math.sqrt(252);
      valoresVh.push(atual.vh);
    }
    let media21Vh = Number(valoresVh.reduce((v: number, i: number) => (v + i))) / 21;
    ativo.volatilidadeMedia = media21Vh.toFixed(3);
  }

  standardDeviation(values) {
    const average = (data) => data.reduce((sum, value) => sum + value, 0) / data.length;

    const avg = average(values);
    const diffs = values.map((value) => value - avg);
    const squareDiffs = diffs.map((diff) => diff * diff);
    const avgSquareDiff = average(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  };

  verificarMartelo(ativo:any) {
    let candle:any  = this.getUltimoCandleDiario(ativo);
    let tamanhoCandle = candle.high - candle.low;

    let projecaoInferior = Math.min(candle.close, candle.open) - candle.low;
    let projecaoSuperior = candle.high -  Math.max(candle.close, candle.open);
    ativo.marteloAlta = projecaoInferior > tamanhoCandle * 0.7;
    ativo.marteloBaixa = projecaoSuperior > tamanhoCandle * 0.7;
    if (ativo.marteloAlta) {
      ativo.marteloProxMedia =  candle.close > ativo.media21Hoje && candle.low < ativo.media21Hoje * 1.01;
    } else if (ativo.marteloBaixa) {
      ativo.marteloProxMedia =  candle.close < ativo.media21Hoje && candle.high > ativo.media21Hoje * 0.99;
    }
  }

}