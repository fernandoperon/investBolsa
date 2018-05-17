import { symbolsNasdaq, symbolsBov, symbolsBovNaoLer15Min } from './../../util/constants';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the RestProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class RestProvider {

  constructor(private http: HttpClient) {
  }

  public getSymbols(tipo: string = `IBOV`, tempo: string) {
    if (tipo == `NASDAQ`) {
      return symbolsNasdaq;
    }
    if (tempo == `diario` || tempo == `historico`) {
      return symbolsBov;
    }
    return symbolsBov.filter((item) => {
      return symbolsBovNaoLer15Min.indexOf(item) < 0;
    });
  }

  getUltimoDiaPregao(data: Date = new Date()) {
    while (this.isBolsaFechada(data)) {
      data.setDate(data.getDate() - 1);
    }
    return data;
  }

  getPenultimoDiaPregao(data: Date = new Date()) {
    data = this.getUltimoDiaPregao(data);
    data.setDate(data.getDate() - 1);
    while (this.isBolsaFechada(data)) {
      data.setDate(data.getDate() - 1);
    }
    return data;
  }

  formataData(data: Date) {
    return new Date(data.getTime() - (data.getTimezoneOffset() * 60000)).toISOString().substr(0, 10);
  }

  formataDataBrasil(data: Date) {
    return data.toISOString().substr(0, 10);
  }
  formataHoraBrasil(data: Date) {
    return data.toISOString().substr(11, 5) + `:00`;
  }

  lerPrecosDiariosBovespa(symbol: string) {
    symbol = symbol.split(`.`)[0];
    let timemillis = new Date().getTime();
    return this.http.get(`http://feed.bolsafinanceira.com/cgi-bin/datafeed.cgi?p=d&t=${symbol}&full=&ts=1&short=1&_=${timemillis}`);
  }

  lerPrecos15MimBovespa(symbol: string) {
    symbol = symbol.split(`.`)[0];
    let timemillis = new Date().getTime();
    return this.http.get(`http://feed.bolsafinanceira.com/cgi-bin/datafeed.cgi?p=15&t=${symbol}&full=&ts=1&short=1&_=${timemillis}`);
  }

  lerPrecosDiariosHistorico(symbol: string) {
    return this.http.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=4EP74V1V49WSAI0T`);
  }

  lerPrecosYahoo(symbol: string, tempo: string) {
    let hoje:Date = new Date();
    hoje.setDate(hoje.getDate() + 1);
    let periodo1 = Math.round(hoje.getTime() / 1000);
    // se tempo é diario ou 15min , le ultimos 15 dias
    let dateOffset = (24*60*60*1000) * 15; //15 days
    if (tempo == `historico`) {
      // se ler historico, entào ler 400 dias
      dateOffset = (24*60*60*1000) * 400; //400 days
    }
    let semanaAtras = new Date();
    semanaAtras.setTime(hoje.getTime() - dateOffset);
    let periodo2 = Math.round(semanaAtras.getTime() / 1000);
    let interval = `1d`;
    if (tempo == `15min`) {
      interval = `15m`;
    }
    return this.http.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?symbol=${symbol}&period1=${periodo2}&period2=${periodo1}&interval=${interval}&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US`);
    // return this.http.get(`http://localhost:8100/api/v8/finance/chart/${symbol}?symbol=${symbol}&period1=${periodo2}&period2=${periodo1}&interval=${interval}&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US`);
  }

  lerPrecosDiarios(symbol: string) {
    return this.http.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=4EP74V1V49WSAI0T`);
  }

  lerBandaBollingerDiarios(symbol: string) {
    return this.http.get(`https://www.alphavantage.co/query?function=BBANDS&symbol=${symbol}&interval=daily&time_period=20&series_type=close&nbdevup=2&nbdevdn=2&apikey=4EP74V1V49WSAI0T`);
  }

  lerPrecos15Min(symbol: string) {
    return this.http.get(`https://www.alphavantage.co/query?interval=15min&function=TIME_SERIES_INTRADAY&symbol=${symbol}&outputsize=compact&apikey=4EP74V1V49WSAI0T`);
  }

  public tratarTimeSeries(seriesData: any, newData: any, texto: string, fonte: string) {

    let valores = newData[texto];

    for (const key in valores) {
      let chave = this.substituirChave(key);
      let bbands = seriesData[chave] ? seriesData[chave].bbands : null;
      seriesData[chave] = {
        key: chave,
        open: Number(valores[key][`1. open`]),
        high: Number(valores[key][`2. high`]),
        low: Number(valores[key][`3. low`]),
        close: Number(valores[key][`4. close`]),
        volume: Number(valores[key][`5. volume`]),
        bbands: bbands,
        fonte: fonte
      };

      if (chave.startsWith(`2016`)) {
        return;
      }
    }
  };

  private substituirChave(chave: string) {
    if (chave.indexOf(` 09:15`) > 0) {
      return chave.replace(` 09:15`, ` 10:00`);
    }
    if (chave.indexOf(` 09:30`) > 0) {
      return chave.replace(` 09:30`, ` 10:15`);
    }
    if (chave.indexOf(` 09:45`) > 0) {
      return chave.replace(` 09:45`, ` 10:30`);
    }
    if (chave.indexOf(` 10:00`) > 0) {
      return chave.replace(` 10:00`, ` 10:45`);
    }
    if (chave.indexOf(` 10:15`) > 0) {
      return chave.replace(` 10:15`, ` 11:00`);
    }
    if (chave.indexOf(` 10:30`) > 0) {
      return chave.replace(` 10:30`, ` 11:15`);
    }
    if (chave.indexOf(` 10:45`) > 0) {
      return chave.replace(` 10:45`, ` 11:30`);
    }
    if (chave.indexOf(` 11:00`) > 0) {
      return chave.replace(` 11:00`, ` 11:45`);
    }
    if (chave.indexOf(` 11:15`) > 0) {
      return chave.replace(` 11:15`, ` 12:00`);
    }
    if (chave.indexOf(` 11:30`) > 0) {
      return chave.replace(` 11:30`, ` 12:15`);
    }
    if (chave.indexOf(` 11:45`) > 0) {
      return chave.replace(` 11:45`, ` 12:30`);
    }
    if (chave.indexOf(` 12:00`) > 0) {
      return chave.replace(` 12:00`, ` 12:45`);
    }
    if (chave.indexOf(` 12:15`) > 0) {
      return chave.replace(` 12:15`, ` 13:00`);
    }
    if (chave.indexOf(` 12:30`) > 0) {
      return chave.replace(` 12:30`, ` 13:15`);
    }
    if (chave.indexOf(` 12:45`) > 0) {
      return chave.replace(` 12:45`, ` 13:30`);
    }
    if (chave.indexOf(` 13:00`) > 0) {
      return chave.replace(` 13:00`, ` 13:45`);
    }
    if (chave.indexOf(` 13:15`) > 0) {
      return chave.replace(` 13:15`, ` 14:00`);
    }
    if (chave.indexOf(` 13:30`) > 0) {
      return chave.replace(` 13:30`, ` 14:15`);
    }
    if (chave.indexOf(` 13:45`) > 0) {
      return chave.replace(` 13:45`, ` 14:30`);
    }
    if (chave.indexOf(` 14:00`) > 0) {
      return chave.replace(` 14:00`, ` 14:45`);
    }
    if (chave.indexOf(` 14:15`) > 0) {
      return chave.replace(` 14:15`, ` 15:00`);
    }
    if (chave.indexOf(` 14:30`) > 0) {
      return chave.replace(` 14:30`, ` 15:15`);
    }
    if (chave.indexOf(` 14:45`) > 0) {
      return chave.replace(` 14:45`, ` 15:30`);
    }
    if (chave.indexOf(` 15:00`) > 0) {
      return chave.replace(` 15:00`, ` 15:45`);
    }
    if (chave.indexOf(` 15:15`) > 0) {
      return chave.replace(` 15:15`, ` 16:00`);
    }
    if (chave.indexOf(` 15:30`) > 0) {
      return chave.replace(` 15:30`, ` 16:15`);
    }
    if (chave.indexOf(` 15:45`) > 0) {
      return chave.replace(` 15:45`, ` 16:30`);
    }
    return chave;
  }

  public tratarBandaBollinger(seriesData: any, newData: any) {

    let valores = newData[`Technical Analysis: BBANDS`];

    for (const key in valores) {
      seriesData[key].bbands = {
        upper: Number(valores[key][`Real Upper Band`]),
        lower: Number(valores[key][`Real Lower Band`])
      };
      return;
    }
  };

  public ordernarSeries(seriesData: any) {
    Object.keys(seriesData).sort().reverse().forEach((key) => {
      let value = seriesData[key];
      delete seriesData[key];
      seriesData[key] = value;
    });
  }

  public tratarTimeSeriesBovespa(seriesData: any, newData: Object, tempo: string = `diario`, fonte: string) {
    if (newData == null) {
      return;
    }
 
    let valores: Array<any> = newData[`data`];
    valores.reverse();

    if (valores.length > 300) {
      valores.splice(301, valores.length - 1);
    }
    valores.forEach((item) => {
      let data = new Date(item[0]);
      let key = this.formataDataBrasil(data);
      if (tempo == `15Min`) {

        key += ` ` + this.formataHoraBrasil(data)
      }
      let open = Number(item[1]);
      let high = Number(item[2]);
      let low = Number([item[3]]);
      let close = Number(item[4]);
      let volume = Number(item[5]);
      let negocios = Number(item[6]);
      seriesData[key] = {
        key: key,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume,
        negocios: negocios,
        fonte: fonte
      };
    });
  }

  /**
   * Simple object check.
   * @param item
   * @returns {boolean}
   */
  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Deep merge two objects.
   * @param target
   * @param ...sources
   */
  mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.mergeDeep(target, ...sources);
  }

  isBolsaFechada(data: Date) {
    if (data.getDay() == 0 || data.getDay() == 6) {
      // se domingo ou sabado
      return true;
    }
    let dataStr = this.formataData(data);
    // lista de feriados
    let feriados = [];
    let feriadosFixo = [`01-01`, `01-25`, `04-21`, `05-01`, `09-07`, `10-12`, `11-02`, `11-15`, `12-25`];
    let feriados2017 = [`2017-02-27`, `2017-02-28`, `2017-04-14`, `2017-06-15`];
    let feriados2018 = [`2018-02-12`, `2018-02-13`, `2018-03-30`, `2018-05-30`];

    for (let i = 2017; i <= 2019; i++) {
      feriadosFixo.forEach((item) => {
        feriados.push(`${i}-${item}`);
      });
    }
    feriados = feriados.concat(feriados2017);
    feriados = feriados.concat(feriados2018);

    if (feriados.indexOf(dataStr) > 0) {
      // se feriado
      return true;
    }
    return false;
  }

  public getUrlImgSymbol(ativo:any) {
    let symbolUrl:string = ativo.symbol;
    symbolUrl = symbolUrl.substr(0,4);
    return `https://novopit.clear.com.br/Content/Icons/${symbolUrl}.png`;
  }

  public getNomeAtivo(ativo:any) {
    return ativo.symbol.split(`.`)[0];
  }


  public tratarResultYahoo(seriesData: any, resultYahoo: any, tempo:string, symbol: string) {
    let periodosMilis: Array<number> = resultYahoo.chart.result[0].timestamp;
    periodosMilis.reverse();
    let closeArray: Array<number> = resultYahoo.chart.result[0].indicators.quote[0].close;
    closeArray.reverse();
    let openArray: Array<number> = resultYahoo.chart.result[0].indicators.quote[0].open;
    openArray.reverse();
    let highArray: Array<number> = resultYahoo.chart.result[0].indicators.quote[0].high;
    highArray.reverse();
    let lowArray: Array<number> = resultYahoo.chart.result[0].indicators.quote[0].low;
    lowArray.reverse();
    let volumeArray: Array<number> = resultYahoo.chart.result[0].indicators.quote[0].volume;
    volumeArray.reverse();

    for (let index = 0; index < periodosMilis.length; index++) {
      let dataMilis: number = periodosMilis[index];
      let data: string = this.formataDataBrasil(new Date(dataMilis * 1000));
      if (tempo == `15min`) {
        let fuso = (3*60*60*1000); //3 horas
        data +=  ` ` + this.formataHoraBrasil(new Date( (dataMilis * 1000) - fuso));
      } 
      let lowAux: Number = lowArray[index];
      let highAux: Number = highArray[index];
      let closeAux: Number = closeArray[index];
      let openAux: Number = openArray[index];
      let volumeAux: Number = volumeArray[index];
      if (lowAux == null || highAux == null || closeAux == null || openAux == null || volumeAux == null) {
        continue;
      }
      let low: Number = new Number(lowAux.toFixed(2));
      let high: Number = new Number(highAux.toFixed(2));
      let close: Number = new Number(closeAux.toFixed(2));
      let open: Number = new Number(openAux.toFixed(2));
      let volume: Number = new Number(volumeAux.toFixed(2));

      seriesData[data] = {
        key: data,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume,
        fonte: `YAHOO`
      };
      
    }
  }
}
