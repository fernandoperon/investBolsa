import { RestProvider } from './../rest/rest';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Setup } from './setup';

/*
  Generated class for the DaytradeSeupProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class DaytradeSetupProvider extends Setup {

  constructor(public http: HttpClient, public restProvider: RestProvider) {
    super(http, restProvider);
  }

  verificarSetup(ativo, tipo: string) {
    if (ativo) {
      this.restProvider.ordernarSeries(ativo.diario);
      this.verificarFaltaCandle(ativo);
      this.verificarGap(ativo);
      this.calcularTamanhoMedioCandle15Min(ativo);
      this.verificarCongestao15min(ativo, tipo);
      this.verificarTendencia(ativo);
      this.projetarVolume(ativo, tipo);
      this.verificarContraGap(ativo, tipo);
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
    ativo.linhaDagua = candlePenultimoDia.close;
    ativo.variacao = variacao.toFixed(2);
  }

  calcularTamanhoMedioCandle15Min(ativo: any) {
    let tamanhos: Array<number> = [];
    for (const key in ativo.min15) {
      let candle = ativo.min15[key];
      tamanhos.push(this.calcularTamanhoCandle(candle));
      if (tamanhos.length > 201) {
        break;
      }
    }
    if (tamanhos.length == 0) {
      return;
    }
    let size = tamanhos.length;

    let tamanhoMedio = tamanhos.reduce((a, b) => {
      return a + b;
    }) / size;
    ativo.tamanhoMedioCandle15Min = tamanhoMedio;
  }

  private calcularTamanhoCandle(candle: any) {
    return (candle.high / candle.low) - 1;
  }

  private obterPrimeirosCandles15Min(ativo: any, tipo: string) {
    if (!ativo.gap) {
      return;
    }

    let diaPegrao = this.restProvider.getUltimoDiaPregao();
    let diaPegraoStr = this.restProvider.formataData(diaPegrao);
    // let diaPegraoStr = `2018-04-05`;
    let horaPrimeiroCandle: String = `09:30:00`;
    let horaSegundoCandle: String = `09:45:00`;
    let horaTerceiroCandle: String = `10:00:00`;
    let horaQuartoCandle: String = `10:15:00`;
    if (tipo == `IBOV`) {
      horaPrimeiroCandle = `10:00:00`;
      horaSegundoCandle = `10:15:00`;
      horaTerceiroCandle = `10:30:00`;
      horaQuartoCandle = `10:45:00`;
      if (!ativo.min15[`${diaPegraoStr} ${horaPrimeiroCandle}`]) {
        horaPrimeiroCandle = `11:00:00`;
        horaSegundoCandle = `11:15:00`;
        horaTerceiroCandle = `11:30:00`;
        horaQuartoCandle = `11:45:00`;
      }
    }
    let candle1 = ativo.min15[`${diaPegraoStr} ${horaPrimeiroCandle}`];
    let candle2 = ativo.min15[`${diaPegraoStr} ${horaSegundoCandle}`];
    let candle3 = ativo.min15[`${diaPegraoStr} ${horaTerceiroCandle}`];
    let candle4 = ativo.min15[`${diaPegraoStr} ${horaQuartoCandle}`];
    if (!candle1) {
      // se não tem os dois primeiros candles, nada faz
      return null;
    }
    return [candle1, candle2, candle3, candle4];
  }

  verificarContraGap(ativo: any, tipo: string) {
    if (!ativo.gap || Math.abs(ativo.gap) > 3 || Math.abs(ativo.gap) < 0.3) {
      return
    }
    let primeirosCandles = this.obterPrimeirosCandles15Min(ativo, tipo);
    if (!primeirosCandles) {
      return;
    }

    let candle1 = primeirosCandles[0];
    let candle2 = primeirosCandles[1];

    // os dois candles tem que ser no mesmo sentido a tem que ter poucas sombras.
    let isCandle1Alta = candle1.close > candle1.open;
    if ((ativo.gap > 0 && isCandle1Alta) || (ativo.gap < 0 && !isCandle1Alta) ) {
      return;
    }

    // candle distancia entre abertura e fechamento tem que ser de 50% do candle;
    if ((Math.abs(candle1.open - candle1.close) / (candle1.high - candle1.low)) < 0.5) {
      return;
    }

    
    if (!candle2) {
      if (ativo.gap > 0 && !isCandle1Alta) {
        ativo.possivelSetupContraGap = true;

      } else if (ativo.gap < 0 && isCandle1Alta) {
        ativo.possivelSetupContraGap = true;
      }
      return;
    }

    let isCandle2Alta = candle2.close > candle2.open;

    if ((Math.abs(candle2.open - candle2.close) / (candle2.high - candle2.low)) < 0.5) {
      return;
    }


    if (ativo.gap > 0 && !isCandle1Alta && !isCandle2Alta) {
      ativo.contraGap = true;
    } else if (ativo.gap < 0 && isCandle1Alta && isCandle2Alta) {
      ativo.contraGap = true;
    }
  }

  verificarCongestao15min(ativo: any, tipo: string) {
    if (!ativo.gap) {
      return;
    }
    let primeirosCandles = this.obterPrimeirosCandles15Min(ativo, tipo);
    if (!primeirosCandles) {
      return;
    }

    let candle1 = primeirosCandles[0];
    let candle2 = primeirosCandles[1];
    let candle3 = primeirosCandles[2];
    let candle4 = primeirosCandles[3];

    let tamanhoCandle1 = this.calcularTamanhoCandle(candle1);

    if (tamanhoCandle1 == 0 || tamanhoCandle1 > ativo.tamanhoMedioCandle15Min * 4) {
      // se o tamanho do primeiro candle for 20% maior que a media, nada faz.
      return;
    }

    let high: number = Number(candle1.high) + ((candle1.high - candle1.low) * 0.3);
    let low: number = candle1.low - ((candle1.high - candle1.low) * 0.3);
    let candle1CorpoMenor = Math.min(candle1.open, candle1.close);
    let candle1CorpoMaior = Math.max(candle1.open, candle1.close);

    if (candle2) {
      let candle2CorpoMenor = Math.min(candle2.open, candle2.close);
      let candle2CorpoMaior = Math.max(candle2.open, candle2.close);
      if (candle2CorpoMaior > candle1CorpoMaior || candle2CorpoMenor < candle1CorpoMenor) {
        if (candle2.high > high || candle2.low < low) {
          return;
        }
      }
    }
    if (candle3) {
      let candle3CorpoMenor = Math.min(candle3.open, candle3.close);
      let candle3CorpoMaior = Math.max(candle3.open, candle3.close);
      if (candle3CorpoMaior > candle1CorpoMaior || candle3CorpoMenor < candle1CorpoMenor) {
        if (candle3.high > high || candle3.low < low) {
          return;
        }
      }
    }
    if (candle4) {
      let candle4CorpoMenor = Math.min(candle4.open, candle4.close);
      let candle4CorpoMaior = Math.max(candle4.open, candle4.close);
      if (candle4CorpoMaior > candle1CorpoMaior || candle4CorpoMenor < candle1CorpoMenor) {
        if (candle4.high > high || candle4.low < low) {
          return;
        }
      }

    }
    ativo.congestao = true;
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

}
