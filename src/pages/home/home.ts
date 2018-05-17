import { symbolsBov } from './../../util/constants';
import { Component } from '@angular/core';
import { NavController, Events, Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { RestProvider } from '../../providers/rest/rest';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  dadosLeitura = {
    tamanho: 0,
    lidos: 0,
    ultimoLido: ``
  };

  constructor(public navCtrl: NavController, public restProvider: RestProvider, 
    private storage: Storage, private events: Events, private platform: Platform) {
    events.subscribe('lerAtivosContraGap', (ativos, fonte) => {
      this.ler('15min', 'bovespa', 'precos', fonte, ativos);
    });
  }

  teste() {
    this.restProvider.getSymbols(`bovespa`, `diario`).forEach((symbol, index) => {
      this.storage.ready().then(() => {
        this.storage.remove(symbol);

        // this.storage.get(symbol).then((val) => {
        // });
      });
    });

  }

  private iniciarDadosLeitura(symbols: Array<string>) {
    this.dadosLeitura.tamanho = symbols.length,
    this.dadosLeitura.lidos = 0;
    this.dadosLeitura.ultimoLido = ``;
  }

  private informarLeitura(ativo:any) {
    this.dadosLeitura.lidos++;
    this.dadosLeitura.ultimoLido = ativo.symbol;
  }

  ler(tempo: string, tipo: string, indicador: string, fonte: string, symbols: Array<string>) {
    if (!symbols || symbols.length == 0) {
      symbols = this.restProvider.getSymbols(tipo, tempo);
    }
    this.iniciarDadosLeitura(symbols);

    symbols.forEach((symbol, index) => {
      this.storage.ready().then(() => {

        this.storage.get(symbol).then((val) => {

          let ativo = val;
          if (!ativo) {
            ativo = {
              symbol: symbol,
              ultimaLeituraMin15: null,
              min15: {},
              ultimaLeituraDiario: null,
              diario: {}
            }
          }

          if (tempo == `diario`) {
            if (fonte == `BF` && indicador == `precos`) {
              this.lerAtivoDiarioBovespaBF(ativo);
            } else if (fonte == `ALPHA` && indicador == `precos`) {
              this.lerAtivoDiarioAlpha(ativo);
            } else if (fonte == `ALPHA` && indicador == `bbands`) {
              this.lerBbandsAtivoDiaroAlpha(ativo);
            } else if (fonte == `YAHOO` && indicador == `precos`) {
              this.lerAtivoYahoo(ativo);
            }
          } else if (tempo == `15min`) {
            if (fonte == `BF`) {
              this.lerAtivo15MinBovespaBF(ativo);
            } else if (fonte == `ALPHA`) {
              this.lerAtivo15MinAlpha(ativo);
            } else if (fonte == `YAHOO`) {
            }
          } else if (tempo == `historico`) {
            if (fonte == `ALPHA` && indicador == `precos`) {
              this.lerAtivoDiarioHistoricoAlpha(ativo);
            } else if (fonte == `YAHOO` && indicador == `precos`) {
              this.lerAtivoYahoo(ativo, tempo);
            }
          }
          this.sleep(100);

        });
      });
    });
  }



  private lerAtivoDiarioBovespaBF(ativo: any) {
    this.restProvider.lerPrecosDiariosBovespa(ativo.symbol).subscribe((result) => {
      this.restProvider.tratarTimeSeriesBovespa(ativo.diario, result, `diario`, `Bolsa Financeira`);
      ativo.ultimaLeituraDiario = new Date();
      this.restProvider.ordernarSeries(ativo.diario);
      this.salvarAtivo(ativo);
    });
  }

  private lerBbandsAtivoDiaroAlpha(ativo: any) {
    this.restProvider.lerBandaBollingerDiarios(ativo.symbol).subscribe((result) => {
      if (result.hasOwnProperty(`Information`) || result.hasOwnProperty(`Error Message`)) {
        this.sleep(1000);
        return this.lerBbandsAtivoDiaroAlpha(ativo);
      }
      this.restProvider.tratarBandaBollinger(ativo.diario, result);
      this.salvarAtivo(ativo);    });
  }

  private lerAtivoYahoo(ativo: any, tempo = `diario`) {
    this.platform.ready().then(() => {

      this.restProvider.lerPrecosYahoo(ativo.symbol, tempo).subscribe((result) => {
        this.restProvider.tratarResultYahoo(ativo.diario, result, tempo, ativo.symbol);
        ativo.ultimaLeituraDiario = this.getDataHoraComDelay();
        if(tempo == `diario`) {
          this.restProvider.lerPrecosYahoo(ativo.symbol, `15min`).subscribe((result) => {
            this.restProvider.tratarResultYahoo(ativo.min15, result, `15min`, ativo.symbol);
            ativo.ultimaLeituraMin15 = this.getDataHoraComDelay();
            this.salvarAtivo(ativo);
          });
        } else {
          this.salvarAtivo(ativo);
        }
      });
    });
  }

  private getDataHoraComDelay() {
    let data = new Date();
    data.setTime( data.getTime() - (15 * 60 * 1000));
    return data;
  }

  private salvarAtivo(ativo:any) {
    this.storage.ready().then(() => {
      this.storage.set(ativo.symbol, ativo);
    });
    this.informarLeitura(ativo);

  }

  private lerAtivoDiarioAlpha(ativo: any) {
    this.restProvider.lerPrecosDiarios(ativo.symbol).subscribe((result) => {
      if (result.hasOwnProperty(`Information`) || result.hasOwnProperty(`Error Message`)) {
        this.sleep(1000);
        return this.lerAtivoDiarioAlpha(ativo);
      }
      this.restProvider.tratarTimeSeries(ativo.diario, result, "Time Series (Daily)", `ALPHA`);

      ativo.ultimaLeituraDiario = new Date();
      this.restProvider.ordernarSeries(ativo.diario);
      this.salvarAtivo(ativo);
    });
  }

  private lerAtivoDiarioHistoricoAlpha(ativo: any) {
    this.restProvider.lerPrecosDiariosHistorico(ativo.symbol).subscribe((result) => {
      if (result.hasOwnProperty(`Information`) || result.hasOwnProperty(`Error Message`)) {
        this.sleep(1000);
        return this.lerAtivoDiarioHistoricoAlpha(ativo);
      }
      this.restProvider.tratarTimeSeries(ativo.diario, result, "Time Series (Daily)", `ALPHA`);

      ativo.ultimaLeituraDiario = new Date();
      this.salvarAtivo(ativo);
    });
  }

  private lerAtivo15MinBovespaBF(ativo: any) {
    this.restProvider.lerPrecos15MimBovespa(ativo.symbol).subscribe((result: Object) => {
      this.restProvider.tratarTimeSeriesBovespa(ativo.min15, result, `15Min`, `Bolsa Financeira`);
      ativo.ultimaLeituraMin15 = new Date();
      this.restProvider.ordernarSeries(ativo.min15);
      this.salvarAtivo(ativo);
    });
  }

  private lerAtivo15MinAlpha(ativo: any) {
    this.restProvider.lerPrecos15Min(ativo.symbol).subscribe((result: Object) => {
      if (result.hasOwnProperty(`Information`) || result.hasOwnProperty(`Error Message`)) {
        this.sleep(1000);
        return this.lerAtivo15MinAlpha(ativo);
      }

      this.restProvider.tratarTimeSeries(ativo.min15, result, "Time Series (15min)", `ALPHA`);
      ativo.ultimaLeituraMin15 = new Date();
      this.salvarAtivo(ativo);
    });
  }


  sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds) {
        break;
      }
    }
  }


  segmentChanged() {

  }
}

