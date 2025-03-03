import { switchToTab } from '../helper.js';

export let db;
let dbInstance = null;

export class DBManager {
	constructor() {
		if (dbInstance) {
			return dbInstance;
		  }
		dbInstance = this;

		this.db = null;
		this.DB_NAME = 'WordSaveDB';
		this.DB_VERSION = 1;
		this.STORE_NAME = 'wordRecords';
	}
  
	// Open database connection
	async init() {
		if (this.initialized) return;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
  
			request.onerror = () => reject(request.error);
  
			request.onsuccess = (event) => {
			  db = event.target.result;
			  this.initialized = true;
			  resolve(request.result);
			}
  
			// Create object store when database is first created
			request.onupgradeneeded = (event) => {
				const db = event.target.result;
  
				if (!db.objectStoreNames.contains(this.STORE_NAME)) {
				  const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
  
				  // too hard
				  objectStore.createIndex("uniqueWordIndex", "word", { unique: true });
				}
			};
		});
	}
  
	async addRecord(db, word, data, lang, apiurl) {
	  if (!db) return;
  
		const record = {
		timestamp: new Date().toISOString(),
		word : word,
		APIdata: data, // Serialize complex object to string
		lang: lang,
		APIurl: apiurl
		};
		
		let isResolved = false;
		const transaction = db.transaction([this.STORE_NAME], 'readwrite');
  
		transaction.oncomplete = (event) => {
		  if (!isResolved) {
			isResolved = true;
		  }
		};
  
		const store = transaction.objectStore(this.STORE_NAME);
		const request = store.add(record);
		
		request.onerror = () => {
		  if (!isResolved) {
			isResolved = true;
			reject(request.error);
		  }
		};
	}
  
	// Delete a record
	async deleteRecord(word) {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.STORE_NAME], 'readwrite');
			const store = transaction.objectStore(this.STORE_NAME);
	  const request = store.getAll();
  
	  request.onsuccess = () => {
		const record = request.result.find(r => 
		  r.word === word
		);
  
		store.delete(record.id);
		switchToTab('/html/list.html');
	  };
	  request.onerror = () => reject(request.error);
		});
	}
  
	async getRecord(word) {
	return new Promise((resolve, reject) => {
	  const transaction = db.transaction([this.STORE_NAME], 'readonly');
	  const store = transaction.objectStore(this.STORE_NAME);
	  const request = store.getAll();
  
	  request.onsuccess = () => {
		const record = request.result.find(r => 
		  r.word === word
		);
		resolve(record || null);
	  };
	  request.onerror = () => reject(request.error);
	});
  }
  
	// Get all records
	async getAllRecords() {
		return new Promise((resolve, reject) => {
		  const transaction = db.transaction([this.STORE_NAME], 'readonly');
		  const store = transaction.objectStore(this.STORE_NAME);
		  const request = store.getAll();
  
		  request.onsuccess = () => {
  
			const records = request.result.map(record => {
			  try {
				return {
				  ...record,
				  APIdata: JSON.parse(record.APIdata)
				};
			  } catch (error) {
				console.error('Parsing error:', error);
				return record; // Return unchanged if parsing fails
			  }
			});
			
			resolve(records);
		  };
  
		  request.onerror = () => reject(request.error);
		});
	}
  }