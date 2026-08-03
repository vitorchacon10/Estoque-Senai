import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { Product, Movement, Delivery } from '../config/models.js';


export async function exportProductsExcel(req, res) {

  const products = await Product.findAll({
    order: [['name','ASC']]
  });


  const workbook = new ExcelJS.Workbook();

  workbook.creator = "SENAI Zerbini";
  workbook.created = new Date();


  const sheet = workbook.addWorksheet(
    'Estoque SENAI',
    {
      properties:{
        tabColor:{
          argb:'E30613'
        }
      }
    }
  );


  // TÍTULO
  sheet.mergeCells('A1:G1');

  const title = sheet.getCell('A1');

  title.value = "RELATÓRIO DE ESTOQUE - SENAI ZERBINI";

  title.font = {
    bold:true,
    size:16,
    color:{
      argb:'FFFFFF'
    }
  };

  title.alignment={
    horizontal:'center'
  };

  title.fill={
    type:'pattern',
    pattern:'solid',
    fgColor:{
      argb:'E30613'
    }
  };


  sheet.addRow([]);


  // CABEÇALHO
  const header = sheet.addRow([
    'Produto',
    'Marca',
    'Quantidade',
    'Validade',
    'Código de Barras',
    'Categoria',
    'Localização'
  ]);


  header.eachCell(cell=>{

    cell.font={
      bold:true,
      color:{
        argb:'FFFFFF'
      }
    };


    cell.fill={
      type:'pattern',
      pattern:'solid',
      fgColor:{
        argb:'333333'
      }
    };


    cell.alignment={
      horizontal:'center'
    };

  });



  products.forEach((p,index)=>{


    const row = sheet.addRow([

      p.name || '-',
      p.brand || '-',
      p.quantity || 0,
      p.expirationDate || '-',
      p.barcode || '-',
      p.category || '-',
      p.location || '-'

    ]);


    // cores alternadas

    if(index % 2 === 0){

      row.eachCell(cell=>{

        cell.fill={
          type:'pattern',
          pattern:'solid',
          fgColor:{
            argb:'F2F2F2'
          }
        };

      });

    }


    // estoque baixo vermelho

    if(p.quantity <= p.minQuantity){

      row.getCell(3).font={
        bold:true,
        color:{
          argb:'FF0000'
        }
      };

    }


  });



  // bordas

  sheet.eachRow(row=>{

    row.eachCell(cell=>{

      cell.border={

        top:{
          style:'thin',
          color:{
            argb:'CCCCCC'
          }
        },

        bottom:{
          style:'thin',
          color:{
            argb:'CCCCCC'
          }
        },

        left:{
          style:'thin',
          color:{
            argb:'CCCCCC'
          }
        },

        right:{
          style:'thin',
          color:{
            argb:'CCCCCC'
          }
        }

      };

    });

  });



  sheet.columns.forEach(column=>{

    column.width = 20;

  });


  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );


  res.setHeader(
    'Content-Disposition',
    'attachment; filename=estoque-senai.xlsx'
  );


  await workbook.xlsx.write(res);

  res.end();

}





export async function exportProductsPdf(req,res){


  const products = await Product.findAll({
    order:[
      ['name','ASC']
    ]
  });



  const doc = new PDFDocument({
    margin:40
  });



  res.setHeader(
    'Content-Type',
    'application/pdf'
  );


  res.setHeader(
    'Content-Disposition',
    'attachment; filename=estoque-senai.pdf'
  );



  doc.pipe(res);



  // CABEÇALHO

  doc
  .rect(0,0,600,70)
  .fill('#E30613');


  doc
  .fillColor('#FFFFFF')
  .fontSize(20)
  .text(
    'RELATÓRIO DE ESTOQUE',
    40,
    25,
    {
      align:'center'
    }
  );



  doc.moveDown(3);



  doc
  .fillColor('#333333')
  .fontSize(12)
  .text(
    `SENAI Zerbini`
  );


  doc.text(
    `Data de emissão: ${dayjs().format('DD/MM/YYYY')}`
  );


  doc.moveDown();



  // tabela

  products.forEach((p,index)=>{


    const y = doc.y;


    if(index % 2 ===0){

      doc
      .rect(
        40,
        y-5,
        520,
        35
      )
      .fill('#F3F3F3');

    }



    doc
    .fillColor('#000')
    .fontSize(10)
    .text(
      `Produto: ${p.name || '-'}`
    )
    .text(
      `Marca: ${p.brand || '-'}   Quantidade: ${p.quantity}`
    )
    .text(
      `Validade: ${p.expirationDate || '-'}   Local: ${p.location || '-'}`
    );


    doc.moveDown();


  });



  doc.moveDown();


  doc
  .fontSize(9)
  .fillColor('#777')
  .text(
    'Sistema de Controle de Estoque - SENAI Zerbini',
    {
      align:'center'
    }
  );



  doc.end();

}





export async function reportCritical(req,res){

  const today = dayjs()
    .format('YYYY-MM-DD');


  const limit = dayjs()
    .add(30,'day')
    .format('YYYY-MM-DD');


  const expired =
    await Product.findAll({
      where:{
        expirationDate:{
          [Op.lt]:today
        }
      }
    });



  const expiring =
    await Product.findAll({
      where:{
        expirationDate:{
          [Op.between]:[
            today,
            limit
          ]
        }
      }
    });



  const lowStock =
    (await Product.findAll())
    .filter(
      p=>p.quantity <= p.minQuantity
    );



  res.json({
    expired,
    expiring,
    lowStock
  });

}





export async function movements(req,res){

 const data =
 await Movement.findAll({
   include:[Product],
   order:[
     ['createdAt','DESC']
   ]
 });

 res.json(data);

}





export async function deliveries(req,res){

 const data =
 await Delivery.findAll({
   include:[Product],
   order:[
     ['createdAt','DESC']
   ]
 });

 res.json(data);

}