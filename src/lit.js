import LitJsSdk from 'lit-js-sdk'

export const createHtmlWrapper = ({ tokenAddress, encryptedZipDataUrl, tokenId }) => {
  const htmlBody = `<h1>Hello.  Only owners of the token at ${tokenAddress} can unlock this content</h1>
  <p>Token state: <span id='lockedHeader'>LOCKED</span></p>
  <button id="unlockButton">Unlock the content</button>
  <br/>
  <br/>
  <div id='mediaGridHolder'></div>
  `
  return LitJsSdk.createHtmlLIT({
    title: `Locked Content for token holders at ${tokenAddress}`,
    htmlBody,
    tokenAddress,
    tokenId,
    chain: 'kovan',
    encryptedZipDataUrl
  })
}
