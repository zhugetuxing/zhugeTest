import React, { useState } from 'react'
import './App.css'
import LitJsSdk from 'lit-js-sdk'
import { createHtmlWrapper } from './lit'

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min) // The maximum is inclusive and the minimum is inclusive
}

function App () {
  const [contractAddress, setContractAddress] = useState('0xA9b2180C2A479Ba9b263878C4d81AE4e0E717846')
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState(null)

  const submit = async () => {
    console.log('submitted')

    // make a fake tokenId because we are using erc20
    const tokenId = getRandomIntInclusive(1, Number.MAX_SAFE_INTEGER)

    // encrypt content
    const lockedContentDataUrl = await LitJsSdk.fileToDataUrl(content)
    const toEncrypt = `<a href="${lockedContentDataUrl}" target="_blank" download="${content.name}"/>Click here to download your locked content</a>`
    const { symmetricKey, encryptedZip } = await LitJsSdk.zipAndEncryptString(toEncrypt)

    // create LIT HTML
    const encryptedZipDataUrl = await LitJsSdk.fileToDataUrl(encryptedZip)
    const htmlString = await createHtmlWrapper({
      tokenAddress: contractAddress,
      encryptedZipDataUrl,
      tokenId
    })
    const litHtmlBlob = new Blob(
      [htmlString],
      { type: 'text/html' }
    )

    // upload to IPFS
    const formData = new FormData()
    formData.append('file', litHtmlBlob)
    const uploadPromise = new Promise((resolve, reject) => {
      fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        mode: 'cors',
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkZTRlMWFkOC0xZDg3LTRlMzMtYmYyMC0zYWE3NjRhODc3YzQiLCJlbWFpbCI6ImNocmlzQGhlbGxvYXByaWNvdC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJpZCI6Ik5ZQzEiLCJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MX1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlfSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNzYyMDg4ZGZjYWI0MGRhNmEzYTIiLCJzY29wZWRLZXlTZWNyZXQiOiIxNWQ1NWMzM2M3YzRjZjkyZTRmNzkxNzYxMjMxNTg5Zjc3NWFmMDNjNGYyOWU5NWE0NTAzNjU4NjRjNzQ2MWJlIiwiaWF0IjoxNjIxMjk5MTUxfQ.rBlfJOgcpDNhecYV2-lNqWg5YRwhN7wvrnmxjRu7LEY'
        },
        body: formData
      }).then(response => response.json())
        .then(data => resolve(data))
        .catch(err => reject(err))
    })

    // get auth sig
    console.log('getting auth sig')
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: 'kovan' })
    console.log('got auth sig')

    // save key to LIT protocol
    await window.litNodeClient.saveEncryptionKey({
      tokenAddress: contractAddress,
      tokenId,
      symmetricKey,
      authSig,
      chain: 'kovan'
    })

    const uploadRespBody = await uploadPromise
    const ipfsCid = uploadRespBody.IpfsHash
    const fileUrl = `https://ipfs.io/ipfs/${ipfsCid}`

    // present URL to user
    setFileUrl(fileUrl)
  }
  const handleContentChosen = (e) => {
    setContent(e.target.files[0])
  }
  return (
    <div className='App'>
      <h1>Lock your content behind an ERC20 token with LIT Protocol</h1>
      <h4>Only users with at least 1 whole token will be able to unlock your content</h4>

      Token contract address:{' '}
      <input type='text' value={contractAddress} onChange={e => setContractAddress(e.target.value)} />

      <br />
      <br />

      Your content:{' '}
      <input
        type='file'
        onClick={e => e.target.value = ''}
        onChange={handleContentChosen}
      />

      <br />
      <br />
      <button onClick={submit}>Submit</button>
      <br />
      {fileUrl ? (
        <>
          <h1>Your locked content is available here: </h1>
          <a href={fileUrl} target='_blank'>{fileUrl}</a>
          <p><strong>Save this url</strong> and make sure it's available to your token holders so they can unlock your content.</p>
        </>
      )
        : null}
      <br />
      <br />
      <br />
      <h3>Instructions from scratch to mint and sell your token and locked content:</h3>
      <p>
        1. Create your ERC20 token.  You can do this at the URL below.  Choose Kovan for the network for the hackathon.
        <br />
        <a href='https://vittominacori.github.io/erc20-generator/create-token/?tokenType=SimpleERC20'>https://vittominacori.github.io/erc20-generator/create-token/?tokenType=SimpleERC20</a>
      </p>
      <p>
        2. Use this website to lock some content into a LIT that corresponds to your new token.  Save the IPFS url that is created.  Provide this URL to your token owners somehow.  Maybe advertise it along side the sale on your twitter or something.  Only token owners will be able to unlock the content at this URL.
      </p>
      <p>
        3. Sell your token and content by creating a new uniswap pool here https://app.uniswap.org/#/add/ETH.
      </p>
    </div>
  )
}

export default App
