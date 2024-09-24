/* modules
-------------------- */
import path from 'path';
import fs from 'fs/promises';
import fetch from 'node-fetch';

(async () => {
  /* 宣言
  -------------------------*/
  // download フォルダを一旦全て削除
  await fs.rm(path.resolve('download/'), { recursive: true, force: true });

  // 調査URL
  const URL = 'https://blm-music.com/';

  // 画像ファイルの保存先
  const download = 'download/';

  // アプライリストが置かれているディレクトリを取得
  const applyListPath = path.resolve('list');

  // アプライリスト名を取得
  const applyListName = await fs.readdir(applyListPath);

  // アプライリストの中身を取得
  const applyContent = await fs.readFile(applyListPath + '/' + applyListName[0], 'utf-8');

  // アプライリストの改行毎に配列の値として格納
  const applyContentList = applyContent.toString().split(/\n|\r\n|\r/);

  // 画像拡張子調査用の正規表現
  const imageRegex = /\.jpg|\.jpeg|\.png|\.gif|\.bmp|\.svg|\.webp/i;

  // 調査するディレクトリの種別を保存する配列
  let applyDirectorys = [];

  // アプライリストの中から画像リストだけをフィルタリング
  const imageApplyAll = applyContentList.map((applyListItem) => {
    if(imageRegex.test(applyListItem)){
      // 画像のディレクトリのみを抽出
      let directory = applyListItem.split('/');
      directory.pop();
      directory = directory.join('/');
      applyDirectorys.push(directory);

      return applyListItem;
    }
  }).filter(Boolean);

  if(imageApplyAll.length == 0) {
    console.log('Worning: 画像ディレクトリが存在しません。処理を終了します');
    return
  }

  // 被っているディレクトリを削除
  applyDirectorys = applyDirectorys.filter((directory, index) => applyDirectorys.indexOf(directory) == index );

  // download 配下にディレクトリ毎のフォルダを生成
  applyDirectorys.forEach((applyDirectory) => {
    const folderName = applyDirectory.replaceAll('/', '-')
    const settingFolder = path.resolve(download + folderName);
    fs.mkdir(settingFolder, {recursive: true});
  });


  /* 実行
  -------------------------*/
  try {

    await Promise.all(imageApplyAll.map(async imageApply => {
      // 調査する画像のURLを格納
      const imageUrl = URL + imageApply;
      let directory = imageApply.split('/');
      const imageName = directory.pop();
      directory = directory.join('/');
      const folderName = directory.replaceAll('/', '-');

      // 調査画像のURLを基に、Webサーバーにアクセスした結果を格納
      const response = await fetch(imageUrl);

      if(response.ok) {
        // 本番画像のバイナリーデータ
        const buffer = new Buffer.from(await response.arrayBuffer());

        // 本番環境の画像をダウンロード
        await fs.writeFile(path.resolve(download + folderName, imageName), buffer);
      }

    }));
  } catch(error) {
    // エラー処理
    console.log('Error', error);
  }

})();